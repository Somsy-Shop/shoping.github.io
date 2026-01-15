// ค่าคงที่สำหรับแอปพลิเคชัน
const APP_CONFIG = {
    ORDER_LINK: "https://line.me/R/oaMessage/@shop123/",
};

// ตัวแปร global
let products = [];
let filteredProducts = [];
let activeCategory = "ທັງໝົດ";
let categories = [];

// DOM Elements
const productsGrid = document.getElementById("products-grid");
const searchInput = document.getElementById("search-input");
const categoryButtonsContainer = document.getElementById("category-buttons");
const productCountElement = document.getElementById("product-count");

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
    const uniqueCategories = new Set();
    categories = ["ທັງໝົດ"];
    
    products.forEach(product => {
        if (product.category && !uniqueCategories.has(product.category)) {
            uniqueCategories.add(product.category);
            categories.push(product.category);
        }
    });
    
    const sortedCategories = Array.from(uniqueCategories).sort();
    categories = ["ທັງໝົດ", ...sortedCategories];
}

// สร้างปุ่มหมวดหมู่แบบไดนามิก
function renderCategoryButtons() {
    categoryButtonsContainer.innerHTML = '';
    
    categories.forEach(category => {
        const button = document.createElement('button');
        button.className = `category-btn ${category === "ທັງໝົດ" ? "active" : ""}`;
        button.dataset.category = category;
        button.textContent = category;
        
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
                <h3>ບໍ່ເຫັນສິນຄ້າທີ່ຄົນຫາ</h3>
                <p>ລອງປ່ຽນຄຳຄົ້ນຫາຫຼືໝວດຫມູ່ສິນຄ້າ</p>
            </div>
        `;
        return;
    }
    
    productsGrid.innerHTML = filteredProducts.map(product => `
        <a href="detail.html?sku=${product.sku}" class="product-card" data-sku="${product.sku}">
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
                    <span class="btn-detail">
                        <i class="fas fa-info-circle"></i> ຄລິກເບິ່ງລາຍລະອຽດ
                    </span>
                </div>
            </div>
        </a>
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
        filterByCategory(activeCategory);
        return;
    }
    
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
    
    const allCategoryButtons = document.querySelectorAll('.category-btn');
    allCategoryButtons.forEach(btn => {
        if (btn.dataset.category === category) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });
    
    if (category === "ທັງໝົດ") {
        filteredProducts = [...products];
    } else {
        filteredProducts = products.filter(product => product.category === category);
    }
    
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

// เริ่มต้น Event Listeners
function initializeEventListeners() {
    searchInput.addEventListener("input", searchProducts);
}

// เริ่มต้นแอปพลิเคชัน
function initializeApp() {
    loadProducts();
    initializeEventListeners();
}

// เริ่มต้นแอปพลิเคชันเมื่อโหลดหน้าเว็บเสร็จ
document.addEventListener('DOMContentLoaded', initializeApp);