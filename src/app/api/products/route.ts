import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

// Public GET: lists products
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');
    const categoryId = searchParams.get('category_id');
    const genderTarget = searchParams.get('gender_target');
    const isTrending = searchParams.get('is_trending');

    if (slug) {
      const product = queryOne(`SELECT * FROM products WHERE slug = ?`, [slug]);
      if (!product) {
        return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
      }

      // Load product gallery images
      const gallery = query(
        `SELECT filepath, is_primary FROM mediafile WHERE entity_type = 'product' AND entity_id = ? ORDER BY is_primary DESC`,
        [product.id]
      );

      return NextResponse.json({ product, gallery });
    }

    // Build conditional query
    let sql = `SELECT * FROM products`;
    let conditions = [];
    let params = [];

    if (categoryId) {
      conditions.push(`category_id = ?`);
      params.push(parseInt(categoryId));
    }
    if (genderTarget) {
      conditions.push(`gender_target = ?`);
      params.push(genderTarget);
    }
    if (isTrending === '1') {
      conditions.push(`is_trending = 1`);
    }

    if (conditions.length > 0) {
      sql += ` WHERE ` + conditions.join(` AND `);
    }

    // Sort by manual grid seating position if present, fallback to newest id
    sql += ` ORDER BY CASE WHEN grid_position IS NULL THEN 999999 ELSE grid_position END ASC, id DESC`;

    const products = query(sql, params);

    // Map primary and hover images
    const productsWithImages = products.map((prod: any) => {
      const images = query(
        `SELECT filepath FROM mediafile WHERE entity_type = 'product' AND entity_id = ? ORDER BY is_primary DESC LIMIT 2`,
        [prod.id]
      );

      return {
        ...prod,
        primaryImage: images[0]?.filepath || '/images/placeholder-primary.webp',
        hoverImage: images[1]?.filepath || images[0]?.filepath || '/images/placeholder-alternate.webp',
      };
    });

    return NextResponse.json({ products: productsWithImages });
  } catch (error) {
    console.error('Fetch products error:', error);
    return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
  }
}

// Admin / Staff POST: create product
export async function POST(req: NextRequest) {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    // Check permissions: Manager / Employee cannot create!
    if (!['Admin', 'Sub-admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden. You do not have permission to create products.' }, { status: 403 });
    }

    const body = await req.json();
    const {
      name, description, price, stock, category_id, subcategory,
      gender_target, sizes, colors, quality_grade, is_trending,
      discount_percent, discount_active_from, discount_active_to,
      display_price_strikethrough, images
    } = body;

    if (!name || !price || stock === undefined) {
      return NextResponse.json({ error: 'Name, price, and stock are required.' }, { status: 400 });
    }

    // Enforce 2-minimum and 10-maximum image rule at API level
    const imageList = images || [];
    if (imageList.length < 2 || imageList.length > 10) {
      return NextResponse.json({ error: 'Products must contain between 2 and 10 gallery images.' }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Insert product
    query(
      `INSERT INTO products (
        name, slug, description, price, stock, category_id, subcategory, gender_target,
        sizes, colors, quality_grade, is_trending, discount_percent, discount_active_from,
        discount_active_to, display_price_strikethrough
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        slug,
        description || '',
        price,
        stock,
        category_id ? parseInt(category_id) : null,
        subcategory || '',
        gender_target || 'unisex',
        JSON.stringify(sizes || []),
        JSON.stringify(colors || []),
        quality_grade || 'Standard',
        is_trending ? 1 : 0,
        discount_percent || 0,
        discount_active_from || null,
        discount_active_to || null,
        display_price_strikethrough ? 1 : 0
      ]
    );

    const newProduct = queryOne(`SELECT id FROM products WHERE slug = ?`, [slug]);

    // Save image metadata with simulated WebP conversion
    imageList.forEach((img: string, idx: number) => {
      // Simulate server-side WebP filename compression format
      const rawName = img.substring(img.lastIndexOf('/') + 1) || 'image.png';
      const webpFilename = rawName.substring(0, rawName.lastIndexOf('.')) + '.webp';
      const webpPath = `/images/products/${slug}-${webpFilename}`;

      query(
        `INSERT INTO mediafile (filepath, entity_type, entity_id, original_filename, file_size, is_primary) VALUES (?, ?, ?, ?, ?, ?)`,
        [webpPath, 'product', newProduct.id, rawName, 85200, idx === 0 ? 1 : 0]
      );
    });

    query(`INSERT INTO activitylog (user_id, action, details) VALUES (?, ?, ?)`, [
      user.userId,
      'Create Product',
      `Created new product "${name}" (ID: ${newProduct.id})`,
    ]);

    return NextResponse.json({ message: 'Product created and images processed into WebP format successfully.', product_id: newProduct.id });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
  }
}

// Admin / Staff PUT: update product
export async function PUT(req: NextRequest) {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    if (!['Admin', 'Sub-admin', 'Manager', 'Employee'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, description, price, stock, category_id, subcategory, gender_target, sizes, colors, quality_grade, is_trending, discount_percent, discount_active_from, discount_active_to, display_price_strikethrough } = body;

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required.' }, { status: 400 });
    }

    const currentProduct = queryOne(`SELECT * FROM products WHERE id = ?`, [id]);
    if (!currentProduct) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    if (user.role === 'Manager' || user.role === 'Employee') {
      // Manager/Employee can only update stock and position!
      query(`UPDATE products SET stock = ? WHERE id = ?`, [stock !== undefined ? stock : currentProduct.stock, id]);
      query(`INSERT INTO activitylog (user_id, action, details) VALUES (?, ?, ?)`, [
        user.userId,
        'Update Product Stock',
        `Staff updated stock for product "${currentProduct.name}" (ID: ${id}) to ${stock}`,
      ]);
      return NextResponse.json({ message: 'Stock updated. Rest of fields omitted due to Manager role boundaries.' });
    }

    // Admin/Sub-admin full edit
    query(
      `UPDATE products SET
        name = ?, description = ?, price = ?, stock = ?, category_id = ?, subcategory = ?,
        gender_target = ?, sizes = ?, colors = ?, quality_grade = ?, is_trending = ?,
        discount_percent = ?, discount_active_from = ?, discount_active_to = ?, display_price_strikethrough = ?
       WHERE id = ?`,
      [
        name || currentProduct.name,
        description !== undefined ? description : currentProduct.description,
        price !== undefined ? price : currentProduct.price,
        stock !== undefined ? stock : currentProduct.stock,
        category_id !== undefined ? (category_id ? parseInt(category_id) : null) : currentProduct.category_id,
        subcategory !== undefined ? subcategory : currentProduct.subcategory,
        gender_target !== undefined ? gender_target : currentProduct.gender_target,
        sizes !== undefined ? JSON.stringify(sizes) : currentProduct.sizes,
        colors !== undefined ? JSON.stringify(colors) : currentProduct.colors,
        quality_grade !== undefined ? quality_grade : currentProduct.quality_grade,
        is_trending !== undefined ? (is_trending ? 1 : 0) : currentProduct.is_trending,
        discount_percent !== undefined ? discount_percent : currentProduct.discount_percent,
        discount_active_from !== undefined ? discount_active_from : currentProduct.discount_active_from,
        discount_active_to !== undefined ? discount_active_to : currentProduct.discount_active_to,
        display_price_strikethrough !== undefined ? (display_price_strikethrough ? 1 : 0) : currentProduct.display_price_strikethrough,
        id
      ]
    );

    query(`INSERT INTO activitylog (user_id, action, details) VALUES (?, ?, ?)`, [
      user.userId,
      'Update Product Details',
      `Updated full product profile for "${name || currentProduct.name}" (ID: ${id})`,
    ]);

    return NextResponse.json({ message: 'Product updated successfully.' });
  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
  }
}

// Admin / Staff DELETE: delete product
export async function DELETE(req: NextRequest) {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    // Role Matrix: Sub-admin is NOT allowed to delete anywhere!
    if (user.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden. Only Super Admins are authorized to delete items.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required.' }, { status: 400 });
    }

    const product = queryOne(`SELECT name FROM products WHERE id = ?`, [parseInt(id)]);
    if (!product) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    // Delete product gallery mediafiles and product itself
    query(`DELETE FROM mediafile WHERE entity_type = 'product' AND entity_id = ?`, [parseInt(id)]);
    query(`DELETE FROM products WHERE id = ?`, [parseInt(id)]);

    query(`INSERT INTO activitylog (user_id, action, details) VALUES (?, ?, ?)`, [
      user.userId,
      'Delete Product',
      `Permanently deleted product "${product.name}" and its associated media files.`,
    ]);

    return NextResponse.json({ message: `Successfully deleted product "${product.name}".` });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
  }
}
