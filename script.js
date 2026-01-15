// ค่าคงที่สำหรับแอปพลิเคชัน
const APP_CONFIG = {
    // กำหนดลิงก์สำหรับสั่งซื้อ - สามารถแก้ไขได้ตามต้องการ
    ORDER_LINK: "https://line.me/R/oaMessage/@shop123/",
    // หรือใช้ลิงก์ Messenger: "https://m.me/yourpagename"
};

// ตัวแปร global
let products = [];
let filteredProducts = [];
let activeCategory = "ทั้งหมด";
let categories = []; // เก็บหมวดหมู่ทั้งหมด

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
        
        // แสดงสินค้าทั้งหมดเริ่มต้น
        filteredProducts = [...products];
        
        // ดึงหมวดหมู่ทั้งหมดจากข้อมูลสินค้า
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

// ดึงหมวดหมู่ทั้งหมดจากข้อมูลสินค้า
function extractCategories() {
    // ใช้ Set เพื่อให้ได้หมวดหมู่ที่ไม่ซ้ำกัน
    const uniqueCategories = new Set();
    
    // เพิ่มหมวดหมู่ "ทั้งหมด" เป็นตัวแรก
    categories = ["ทั้งหมด"];
    
    // ดึงหมวดหมู่จากสินค้าทุกตัว
    products.forEach(product => {
        if (product.category && !uniqueCategories.has(product.category)) {
            uniqueCategories.add(product.category);
            categories.push(product.category);
        }
    });
    
    // เรียงลำดับหมวดหมู่ (ไม่รวม "ทั้งหมด")
    const sortedCategories = Array.from(uniqueCategories).sort();
    categories = ["ทั้งหมด", ...sortedCategories];
}

// สร้างปุ่มหมวดหมู่แบบไดนามิก
function renderCategoryButtons() {
    // ล้างปุ่มหมวดหมู่เดิม (ถ้ามี)
    categoryButtonsContainer.innerHTML = '';
    
    // สร้างปุ่มหมวดหมู่ใหม่จาก categories
    categories.forEach(category => {
        const button = document.createElement('button');
        button.className = `category-btn ${category === "ทั้งหมด" ? "active" : ""}`;
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
                <h3>ไม่พบสินค้าที่ค้นหา</h3>
                <p>ลองเปลี่ยนคำค้นหาหรือหมวดหมู่ดูนะครับ</p>
            </div>
        `;
        return;
    }
    
    productsGrid.innerHTML = filteredProducts.map(product => `
        <div class="product-card" data-sku="${product.sku}">
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" loading="lazy">
            </div>
            <div class="product-info">
                <div class="product-category">${product.category}</div>
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description.substring(0, 80)}${product.description.length > 80 ? '...' : ''}</p>
                
                <div class="product-details">
                    <div class="product-price">฿${product.price.toLocaleString()}</div>
                    <div class="product-sku">SKU: ${product.sku}</div>
                </div>
                
                <div class="product-actions">
                    <button class="btn-detail" onclick="showProductDetail('${product.sku}')">
                        <i class="fas fa-info-circle"></i> รายละเอียด
                    </button>
                    <button class="btn-order" onclick="handleOrder('${product.sku}', '${product.name}')">
                        <i class="fas fa-shopping-cart"></i> สั่งซื้อ
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
    if (category === "ทั้งหมด") {
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

// แสดงรายละเอียดสินค้าใน modal
function showProductDetail(sku) {
    const product = products.find(p => p.sku === sku);
    
    if (!product) return;
    
    modalBody.innerHTML = `
        <div class="modal-product">
            <div class="modal-product-image">
                <img src="${product.image}" alt="${product.name}">
            </div>
            <div class="modal-product-info">
                <h2>${product.name}</h2>
                <div class="modal-product-category">${product.category}</div>
                <div class="modal-product-price">฿${product.price.toLocaleString()}</div>
                <div class="modal-product-sku">SKU: ${product.sku}</div>
                <p class="modal-product-description">${product.description}</p>
                
                <div class="modal-details">
                    <h3>ไซส์ที่รองรับ</h3>
                    <div class="sizes-container">
                        ${product.sizes.map(size => `<span class="size-item">${size}</span>`).join('')}
                    </div>
                    
                    <h3>สีที่รองรับ</h3>
                    <div class="colors-container">
                        ${product.colors.map(color => `<span class="color-item">${color}</span>`).join('')}
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button class="btn-modal-order" onclick="handleOrder('${product.sku}', '${product.name}')">
                        <i class="fas fa-shopping-cart"></i> สั่งซื้อผ่าน LINE
                    </button>
                </div>
            </div>
        </div>
    `;
    
    productModal.style.display = "flex";
    document.body.style.overflow = "hidden"; // ป้องกันการสกรอลหน้าเว็บ
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