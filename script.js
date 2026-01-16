// script.js
// ค่าคงที่สำหรับแอปพลิเคชัน
const APP_CONFIG = {
    ORDER_LINK: "https://line.me/R/oaMessage/@shop123/",
    CURRENCY: "₭",
    ITEMS_PER_PAGE: 8
};

// ตัวแปร global
let products = [];
let filteredProducts = [];
let activeCategory = "all";
let categories = [];
let currentPage = 1;
let totalPages = 1;

// DOM Elements
const productsGrid = document.getElementById("products-grid");
const searchInput = document.getElementById("search-input");
const categoryButtonsContainer = document.getElementById("category-buttons");
const productCountElement = document.getElementById("product-count");
const pagination = document.getElementById("pagination");
const prevPageBtn = document.getElementById("prev-page");
const nextPageBtn = document.getElementById("next-page");
const pageNumbers = document.getElementById("page-numbers");

// Notification Elements
let notification = null;
let notificationText = null;

// สร้าง notification element
function createNotification() {
    notification = document.createElement('div');
    notification.className = 'notification';
    notification.id = 'notification';
    
    const icon = document.createElement('i');
    icon.className = 'fas fa-check-circle';
    
    notificationText = document.createElement('span');
    notificationText.id = 'notification-text';
    
    notification.appendChild(icon);
    notification.appendChild(notificationText);
    document.body.appendChild(notification);
}

// โหลดข้อมูลสินค้า
async function loadProducts() {
    try {
        const response = await fetch('data.json');
        products = await response.json();
        
        // เพิ่ม flag available สำหรับทุกสินค้า
        products.forEach(product => {
            product.available = product.preorder !== undefined ? product.preorder : (product.stock > 0);
        });
        
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
        showErrorMessage();
    }
}

// แสดงข้อความ error
function showErrorMessage() {
    productsGrid.innerHTML = `
        <div class="error-message" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
            <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: #ccc; margin-bottom: 15px;"></i>
            <h3>ไม่สามารถโหลดข้อมูลสินค้าได้</h3>
            <p>กรุณาตรวจสอบการเชื่อมต่อหรือไฟล์ data.json</p>
            <button onclick="location.reload()" class="btn-order" style="margin-top: 20px;">
                <i class="fas fa-redo"></i> โหลดใหม่
            </button>
        </div>
    `;
}

// ดึงหมวดหมู่ทั้งหมดจากข้อมูลสินค้า
function extractCategories() {
    const uniqueCategories = new Set();
    
    products.forEach(product => {
        if (product.category && !uniqueCategories.has(product.category)) {
            uniqueCategories.add(product.category);
        }
    });
    
    const sortedCategories = Array.from(uniqueCategories).sort();
    categories = sortedCategories;
}

// สร้างปุ่มหมวดหมู่แบบไดนามิก
function renderCategoryButtons() {
    categoryButtonsContainer.innerHTML = '';
    
    // เพิ่มปุ่ม "ทั้งหมด"
    const allButton = document.createElement('button');
    allButton.className = `category-btn ${activeCategory === "all" ? "active" : ""}`;
    allButton.dataset.category = "all";
    allButton.innerHTML = `ທັງໝົດ`;
    allButton.addEventListener('click', () => {
        activeCategory = "all";
        currentPage = 1;
        applyFilters();
        updateCategoryButtons();
    });
    categoryButtonsContainer.appendChild(allButton);
    
    categories.forEach(category => {
        const button = document.createElement('button');
        button.className = `category-btn ${category === activeCategory ? "active" : ""}`;
        button.dataset.category = category;
        button.textContent = category;
        
        button.addEventListener('click', () => {
            activeCategory = category;
            currentPage = 1;
            applyFilters();
            updateCategoryButtons();
        });
        
        categoryButtonsContainer.appendChild(button);
    });
}

// อัปเดตสถานะปุ่มหมวดหมู่
function updateCategoryButtons() {
    const categoryBtns = document.querySelectorAll('.category-btn');
    categoryBtns.forEach(btn => {
        if (btn.dataset.category === activeCategory) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
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
        pagination.style.display = 'none';
        return;
    }
    
    // คำนวณสินค้าที่จะแสดงในหน้าปัจจุบัน
    const startIndex = (currentPage - 1) * APP_CONFIG.ITEMS_PER_PAGE;
    const endIndex = startIndex + APP_CONFIG.ITEMS_PER_PAGE;
    const productsToShow = filteredProducts.slice(startIndex, endIndex);
    
    productsGrid.innerHTML = productsToShow.map(product => `
        <a href="detail.html?sku=${product.sku}" class="product-card" data-sku="${product.sku}">
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" loading="lazy" 
                     onerror="this.src='img/placeholder.jpg'">
                
                <!-- Badges สำหรับ preorder และ sale -->
                <div class="product-badges">
                    ${product.preorder ? '<span class="badge preorder">ພຮີອໍເດີ້</span>' : ''}
                    ${product.sale ? '<span class="badge sale">ລາຄາພິເສດ</span>' : ''}
                </div>
            </div>
            <div class="product-info">
                <div class="product-category">${product.category}</div>
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description.substring(0, 80)}${product.description.length > 80 ? '...' : ''}</p>
                
                <div class="product-details">
                    <div class="price-container">
                        <div class="product-price">
                            ${formatPrice(product.price)} ${APP_CONFIG.CURRENCY}
                            ${product.sale && product.originalPrice ? `
                                <span class="original-price">
                                    ${formatPrice(product.originalPrice)} ${APP_CONFIG.CURRENCY}
                                </span>
                            ` : ''}
                        </div>
                        ${product.sale && product.originalPrice ? `
                            <div class="discount-badge">
                                -${calculateDiscount(product.originalPrice, product.price)}%
                            </div>
                        ` : ''}
                    </div>
                    <div class="product-sku">SKU: ${product.sku}</div>
                </div>
                
                <!-- Stock info -->
                <div class="stock-info-mini">
                    ${product.preorder ? `
                        <i class="fas fa-clock preorder-icon"></i>
                        <span class="preorder-text">ພຮີອໍເດີ້</span>
                    ` : `
                        <i class="fas ${product.stock > 0 ? 'fa-check-circle success' : 'fa-times-circle error'}"></i>
                        <span>${product.stock > 0 ? 'ມີສິນຄ້າ' : 'ຫມົດສິນຄ້າ'}</span>
                        ${product.stock ? `<span class="stock-count">(${product.stock} ຊິ້ນ)</span>` : ''}
                    `}
                </div>
                
                <div class="product-actions">
                    <span class="btn-detail">
                        <i class="fas fa-info-circle"></i> ເບິ່ງລາຍລະອຽດ
                    </span>
                </div>
            </div>
        </a>
    `).join('');
    
    renderPagination();
}

// คำนวณส่วนลด
function calculateDiscount(originalPrice, salePrice) {
    if (!originalPrice || originalPrice <= salePrice) return 0;
    const discount = ((originalPrice - salePrice) / originalPrice) * 100;
    return Math.round(discount);
}

// จัดรูปแบบราคา
function formatPrice(price) {
    if (typeof price === 'number') {
        return price.toLocaleString('lo-LA');
    }
    return price;
}

// อัปเดตจำนวนสินค้า
function updateProductCount() {
    productCountElement.textContent = filteredProducts.length;
}

// ค้นหาสินค้าแบบ real-time
function searchProducts() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    currentPage = 1;
    applyFilters(searchTerm);
}

// ใช้ฟิลเตอร์ทั้งหมด
function applyFilters(searchTerm = '') {
    let result = [...products];
    
    // กรองตามคำค้นหา
    if (searchTerm) {
        result = result.filter(product => 
            product.name.toLowerCase().includes(searchTerm) || 
            product.sku.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm)
        );
    } else if (searchInput.value.trim()) {
        result = result.filter(product => 
            product.name.toLowerCase().includes(searchInput.value.toLowerCase().trim()) || 
            product.sku.toLowerCase().includes(searchInput.value.toLowerCase().trim())
        );
    }
    
    // กรองตามหมวดหมู่
    if (activeCategory !== 'all') {
        result = result.filter(product => product.category === activeCategory);
    }
    
    // อัปเดตตัวแปร global
    filteredProducts = result;
    
    // แสดงผล
    renderProducts();
    updateProductCount();
}

// แสดง Pagination
function renderPagination() {
    totalPages = Math.ceil(filteredProducts.length / APP_CONFIG.ITEMS_PER_PAGE);
    
    if (totalPages <= 1) {
        pagination.style.display = 'none';
        return;
    }
    
    pagination.style.display = 'flex';
    
    // อัปเดตปุ่ม Previous/Next
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;
    
    // สร้างเลขหน้า
    pageNumbers.innerHTML = '';
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `page-number ${i === currentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', () => {
            currentPage = i;
            renderProducts();
        });
        pageNumbers.appendChild(pageBtn);
    }
}

// แสดงการแจ้งเตือน
function showNotification(message) {
    if (!notification) {
        createNotification();
    }
    
    notificationText.textContent = message;
    notification.classList.add("show");
    
    setTimeout(() => {
        notification.classList.remove("show");
    }, 3000);
}

// เริ่มต้น Event Listeners
function initializeEventListeners() {
    searchInput.addEventListener("input", searchProducts);
    
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderProducts();
        }
    });
    
    nextPageBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderProducts();
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            searchInput.value = '';
            searchProducts();
        }
    });
}

// เริ่มต้นแอปพลิเคชัน
function initializeApp() {
    createNotification();
    loadProducts();
    initializeEventListeners();
}

// Mobile Menu Handling
const menuToggle = document.getElementById('menuToggle');
const navMenu = document.getElementById('navMenu');
const navLinks = document.querySelectorAll('.nav-link');

if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        menuToggle.classList.toggle('active');
    });

    // Close mobile menu when clicking a link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            menuToggle.classList.remove('active');
        });
    });

    // Active link highlighting
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
        });
    });

    // Close menu when clicking outside (for mobile)
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            if (!navMenu.contains(e.target) && !menuToggle.contains(e.target)) {
                navMenu.classList.remove('active');
                menuToggle.classList.remove('active');
            }
        }
    });

    // Close menu on scroll (for mobile)
    window.addEventListener('scroll', () => {
        if (window.innerWidth <= 768) {
            navMenu.classList.remove('active');
            menuToggle.classList.remove('active');
        }
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            navMenu.classList.remove('active');
            menuToggle.classList.remove('active');
        }
    });
}

// เริ่มต้นแอปพลิเคชันเมื่อโหลดหน้าเว็บเสร็จ
document.addEventListener('DOMContentLoaded', initializeApp);