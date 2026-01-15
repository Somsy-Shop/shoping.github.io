// ค่าคงที่สำหรับแอปพลิเคชัน
const APP_CONFIG = {
    // กำหนดลิงก์สำหรับสั่งซื้อ - สามารถแก้ไขได้ตามต้องการ
    ORDER_LINK: "https://line.me/R/oaMessage/@shop123/",
    // หรือใช้ลิงก์ Messenger: "https://m.me/yourpagename"
};

// ตัวแปร global
let products = [];
let filteredProducts = [];
let activeCategory = "ທັງຫມົດ";
let categories = []; // เก็บหมวดหมู่ທັງຫມົດ

// DOM Elements
const productsGrid = document.getElementById("products-grid");
const searchInput = document.getElementById("search-input");
const categoryButtonsContainer = document.querySelector(".category-buttons");
const productCountElement = document.getElementById("product-count");
const productModal = document.getElementById("product-modal");
const closeModalButton = document.getElementById("close-modal");
const modalBody = document.getElementById("modal-body");
const notification = document.getElementById("notification");
const notificationText = document.getElementById("notification-text");

// โหลดข้อมูลสินค้า
async function loadProducts() {
    try {
        const response = await fetch('data.json');
        products = await response.json();
        
        // แสดงสินค้าທັງຫມົດเริ่มต้น
        filteredProducts = [...products];
        
        // ดึงหมวดหมู่ທັງຫມົດจากข้อมูลสินค้า
        extractCategories();
        
        // สร้างปุ่มหมวดหมู่แบบไดนามิก
        renderCategoryButtons();
        
        // แสดงสินค้า
        renderProducts();
        updateProductCount();
    } catch (error) {
        console.error('Error loading products:', error);
        productsGrid.innerHTML = `
            <div class="error-message" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: #ccc; margin-bottom: 15px;"></i>
                <h3>ไม่สามารถโหลดข้อมูลสินค้าได้</h3>
                <p>กรุณาตรวจสอบการเชื่อมต่อหรือไฟล์ data.json</p>
            </div>
        `;
    }
}

// ดึงหมวดหมู่ທັງຫມົດจากข้อมูลสินค้า
function extractCategories() {
    // ใช้ Set เพื่อให้ได้หมวดหมู่ที่ไม่ซ้ำกัน
    const uniqueCategories = new Set();
    
    // เพิ่มหมวดหมู่ "ທັງຫມົດ" เป็นตัวแรก
    categories = ["ທັງຫມົດ"];
    
    // ดึงหมวดหมู่จากสินค้าทุกตัว
    products.forEach(product => {
        if (product.category && !uniqueCategories.has(product.category)) {
            uniqueCategories.add(product.category);
            categories.push(product.category);
        }
    });
    
    // เรียงลำดับหมวดหมู่ (ไม่รวม "ທັງຫມົດ")
    const sortedCategories = Array.from(uniqueCategories).sort();
    categories = ["ທັງຫມົດ", ...sortedCategories];
}

// สร้างปุ่มหมวดหมู่แบบไดนามิก
function renderCategoryButtons() {
    // ล้างปุ่มหมวดหมู่เดิม (ถ้ามี)
    categoryButtonsContainer.innerHTML = '';
    
    // สร้างปุ่มหมวดหมู่ใหม่จาก categories
    categories.forEach(category => {
        const button = document.createElement('button');
        button.className = `category-btn ${category === "ທັງຫມົດ" ? "active" : ""}`;
        button.dataset.category = category;
        button.textContent = category;
        
        // เพิ่ม Event Listener
        button.addEventListener('click', () => {
            filterByCategory(category);
        });
        
        categoryButtonsContainer.appendChild(button);
    });
}

// แสดงสินค้าลงใน grid
function renderProducts() {
    if (filteredProducts.length === 0) {
        productsGrid.innerHTML = `
            <div class="no-products" style="grid-column: 1 / -1; text-align: center; padding: 50px;">
                <i class="fas fa-search" style="font-size: 3rem; color: #ccc; margin-bottom: 15px;"></i>
                <h3>ບໍ່ເຫັນສິນຄ້າທີ່ກຳລັງຫາ</h3>
                <p>ລອງປ່ຽນຄຳຄົ້ນຫາຫຼືຫມວດຫມູ່ເບິ່ງເດີເຈົ້າ</p>
            </div>
        `;
        return;
    }
    
    productsGrid.innerHTML = filteredProducts.map(product => `
        <div class="product-card" data-sku="${product.sku}" ondblclick="showProductDetail('${product.sku}')">
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" loading="lazy">
            </div>
            <div class="product-info">
                <div class="product-category">${product.category}</div>
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description.substring(0, 80)}${product.description.length > 80 ? '...' : ''}</p>
                
                <div class="product-details">
                    <div class="product-price">${product.price.toLocaleString()} ກີບ</div>
                    <div class="product-sku">SKU: ${product.sku}</div>
                </div>
                
                <div class="product-actions">
                    <button class="btn-detail" onclick="showProductDetail('${product.sku}')">
                        <i class="fas fa-info-circle"></i> ລາຍລະອຽດ
                    </button>
                    <button class="btn-order" onclick="handleOrder('${product.sku}', '${product.name}')">
                        <i class="fas fa-shopping-cart"></i> ສັ່ງຊື້
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// อัปเดตจำนวนสินค้า
function updateProductCount() {
    productCountElement.textContent = filteredProducts.length;
}

// ค้นหาสินค้าแบบ real-time
function searchProducts() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (searchTerm === "") {
        // ถ้าไม่มีคำค้นหา ให้แสดงสินค้าตามหมวดหมู่ที่เลือก
        filterByCategory(activeCategory);
        return;
    }
    
    // กรองสินค้าตามคำค้นหา (ชื่อหรือ SKU)
    filteredProducts = products.filter(product => 
        product.name.toLowerCase().includes(searchTerm) || 
        product.sku.toLowerCase().includes(searchTerm)
    );
    
    renderProducts();
    updateProductCount();
}

// กรองสินค้าตามหมวดหมู่
function filterByCategory(category) {
    activeCategory = category;
    
    // อัปเดตปุ่มหมวดหมู่
    const allCategoryButtons = document.querySelectorAll('.category-btn');
    allCategoryButtons.forEach(btn => {
        if (btn.dataset.category === category) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });
    
    // กรองสินค้า
    if (category === "ທັງຫມົດ") {
        filteredProducts = [...products];
    } else {
        filteredProducts = products.filter(product => product.category === category);
    }
    
    // ถ้ามีคำค้นหา ให้กรองซ้ำด้วยคำค้นหา
    const searchTerm = searchInput.value.toLowerCase().trim();
    if (searchTerm !== "") {
        filteredProducts = filteredProducts.filter(product => 
            product.name.toLowerCase().includes(searchTerm) || 
            product.sku.toLowerCase().includes(searchTerm)
        );
    }
    
    renderProducts();
    updateProductCount();
}

// สร้างแกลเลอรีรูปภาพ
function createImageGallery(images) {
    currentImageIndex = 0;
    
    // สร้าง thumbnail จาก 4 รูปแรก หรือตามที่มี
    const displayImages = images.slice(0, 4);
    
    return `
        <div class="image-gallery">
            <div class="main-image-container">
                <img id="main-image" class="main-image" src="${displayImages[0]}" alt="Product Image">
                ${displayImages.length > 1 ? `
                    <button class="image-nav-btn prev-btn" onclick="changeImage(-1, ${displayImages.length})">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <button class="image-nav-btn next-btn" onclick="changeImage(1, ${displayImages.length})">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                ` : ''}
            </div>
            
            <div class="thumbnail-container">
                ${displayImages.map((img, index) => `
                    <div class="thumbnail ${index === 0 ? 'active' : ''}" onclick="selectImage(${index}, ${displayImages.length})">
                        <img src="${img}" alt="Thumbnail ${index + 1}">
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// เปลี่ยนรูปหลักในแกลเลอรี
function changeImage(direction, totalImages) {
    currentImageIndex = (currentImageIndex + direction + totalImages) % totalImages;
    updateGallery();
}

// เลือกรูปจาก thumbnail
function selectImage(index, totalImages) {
    currentImageIndex = index;
    updateGallery();
}

// อัปเดตแกลเลอรี
function updateGallery() {
    const mainImage = document.getElementById('main-image');
    const thumbnails = document.querySelectorAll('.thumbnail');
    
    if (mainImage) {
        const currentProduct = document.querySelector('.modal-product');
        if (currentProduct) {
            const productImages = currentProduct.dataset.images ? JSON.parse(currentProduct.dataset.images) : [];
            if (productImages.length > 0) {
                mainImage.src = productImages[currentImageIndex];
                
                // อัปเดต thumbnail ที่ active
                thumbnails.forEach((thumb, index) => {
                    if (index === currentImageIndex) {
                        thumb.classList.add('active');
                    } else {
                        thumb.classList.remove('active');
                    }
                });
            }
        }
    }
}
// แสดงรายละเอียดสินค้าใน modal
function showProductDetail(sku) {
    const product = products.find(p => p.sku === sku);
    
    if (!product) return;
    
    modalBody.innerHTML = `
        <div class="modal-product" data-images='${JSON.stringify(product.images)}'>
            <div class="modal-product-image">
                ${createImageGallery(product.images)}
            </div>
            <div class="modal-product-info">
                <h2>${product.name}</h2>
                <div class="modal-product-category">${product.category}</div>
                <div class="modal-product-price">${product.price.toLocaleString()} ກີບ</div>
                <div class="modal-product-sku">SKU: ${product.sku}</div>
                <p class="modal-product-description">${product.description}</p>
                
                <div class="modal-details">
                    <h3>ຂະໜາດທີ່ຮອງຮັບ(size)</h3>
                    <div class="sizes-container">
                        ${product.sizes.map(size => `<span class="size-item">${size}</span>`).join('')}
                    </div>
                    
                    <h3>ສີທີ່ຮອງຮັບ</h3>
                    <div class="colors-container">
                        ${product.colors.map(color => `<span class="color-item">${color}</span>`).join('')}
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button class="btn-modal-order" onclick="handleOrder('${product.sku}', '${product.name}')">
                        <i class="fas fa-shopping-cart"></i> ສັ່ງຊື້ຜ່ານ LINE
                    </button>
                </div>
            </div>
        </div>
    `;
    
    productModal.style.display = "flex";
    document.body.style.overflow = "hidden";
}



// จัดการการสั่งซื้อ
function handleOrder(sku, productName) {
    // คัดลอก SKU ไปที่คลิปบอร์ด
    copyToClipboard(sku);
    
    // แสดงแจ้งเตือน
    showNotification(`คัดลอก "${sku}" เรียบร้อยแล้ว!`);
    
    // เปิดลิงก์สั่งซื้อ (สามารถเปลี่ยนเป็น Messenger ได้)
    setTimeout(() => {
        window.open(APP_CONFIG.ORDER_LINK, '_blank');
    }, 800);
}

// คัดลอกข้อความไปที่คลิปบอร์ด
function copyToClipboard(text) {
    // ใช้ Clipboard API ถ้าพร้อมใช้งาน
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text);
    } else {
        // วิธีเก่าสำหรับ browser ที่ไม่รองรับ Clipboard API
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
    }
}

// แสดงการแจ้งเตือน
function showNotification(message) {
    notificationText.textContent = message;
    notification.classList.add("show");
    
    setTimeout(() => {
        notification.classList.remove("show");
    }, 3000);
}

// ปิด modal
function closeModal() {
    productModal.style.display = "none";
    document.body.style.overflow = "auto"; // ปลดล็อกการสกรอล
}

// เริ่มต้น Event Listeners
function initializeEventListeners() {
    // ค้นหาแบบ real-time
    searchInput.addEventListener("input", searchProducts);
    
    // ปิด modal
    closeModalButton.addEventListener("click", closeModal);
    
    // ปิด modal เมื่อคลิกภายนอก
    productModal.addEventListener("click", (e) => {
        if (e.target === productModal) {
            closeModal();
        }
    });
    
    // ปิด modal ด้วยปุ่ม ESC
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && productModal.style.display === "flex") {
            closeModal();
        }
    });
}

// เริ่มต้นแอปพลิเคชัน
function initializeApp() {
    loadProducts();
    initializeEventListeners();
}

// เริ่มต้นแอปพลิเคชันเมื่อโหลดหน้าเว็บเสร็จ
document.addEventListener('DOMContentLoaded', initializeApp);