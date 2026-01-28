// detail.js
// ค่าคงที่สำหรับแอปพลิเคชัน
const APP_CONFIG = {
    ORDER_LINK: "https://www.facebook.com/messages/t/somsyonlineshop",
    CURRENCY: "₭"
};

// ตัวแปร global
let currentProduct = null;
let currentImageIndex = 0;
let totalImages = 0;

// DOM Elements
const productDetailContainer = document.getElementById("product-detail-container");
const urlParams = new URLSearchParams(window.location.search);
const sku = urlParams.get('sku');

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

// สร้างแกลเลอรี่รูปภาพ
function createImageGallery(images) {
    // จำกัดรูปไม่ให้เกิน 8 รูป
    const displayImages = images.slice(0, 8);
    totalImages = displayImages.length;
    currentImageIndex = 0;

    return `
        <div class="image-gallery">
            <div class="main-image-container">
                <img id="main-image" class="main-image" src="${displayImages[0]}" alt="Product Image" onclick="openZoomView(${currentImageIndex})">
                ${displayImages.length > 1 ? `
                    <button class="image-nav-btn prev-btn" onclick="changeImage(-1)" id="prev-btn">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <button class="image-nav-btn next-btn" onclick="changeImage(1)" id="next-btn">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                ` : ''}
                <div class="image-counter">${currentImageIndex + 1} / ${displayImages.length}</div>
            </div>
            
            ${displayImages.length > 1 ? `
                <div class="thumbnail-container">
                    ${displayImages.map((img, index) => `
                        <div class="thumbnail ${index === 0 ? 'active' : ''}" 
                             onclick="selectImage(${index})" 
                             data-index="${index}">
                            <img src="${img}" alt="Thumbnail ${index + 1}">
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </div>
        
        <div class="zoom-overlay" id="zoom-overlay">
            <button class="close-zoom" onclick="closeZoomView()">&times;</button>
            <img class="zoom-image" id="zoom-image" src="" alt="Zoomed Image">
            ${displayImages.length > 1 ? `
                <button class="zoom-nav-btn zoom-prev-btn" onclick="changeZoomImage(-1)">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <button class="zoom-nav-btn zoom-next-btn" onclick="changeZoomImage(1)">
                    <i class="fas fa-chevron-right"></i>
                </button>
                <div class="image-counter-zoom" id="zoom-counter">1 / ${displayImages.length}</div>
            ` : ''}
        </div>
    `;
}

// เปลี่ยนรูปหลักในแกลเลอรี่
function changeImage(direction) {
    const newIndex = (currentImageIndex + direction + totalImages) % totalImages;
    selectImage(newIndex);
}

// เลือกรูปจาก thumbnail
function selectImage(index) {
    if (index < 0 || index >= totalImages) return;
    currentImageIndex = index;

    const mainImage = document.getElementById('main-image');
    const zoomImage = document.getElementById('zoom-image');

    if (mainImage && currentProduct && currentProduct.images) {
        const targetImg = currentProduct.images[currentImageIndex];
        mainImage.src = targetImg;

        if (zoomImage) {
            zoomImage.src = targetImg;
        }

        const imageCounter = document.querySelector('.main-image-container .image-counter');
        const zoomCounter = document.getElementById('zoom-counter');

        if (imageCounter) {
            imageCounter.textContent = `${currentImageIndex + 1} / ${totalImages}`;
        }
        if (zoomCounter) {
            zoomCounter.textContent = `${currentImageIndex + 1} / ${totalImages}`;
        }

        const thumbnails = document.querySelectorAll('.thumbnail');
        thumbnails.forEach((thumb, i) => {
            thumb.classList.toggle('active', i === currentImageIndex);
        });

        updateNavButtons();
    }
}

// อัปเดตสถานะปุ่มเลื่อน
function updateNavButtons() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    if (prevBtn && nextBtn) {
        prevBtn.disabled = currentImageIndex === 0;
        nextBtn.disabled = currentImageIndex === totalImages - 1;
    }
}

// เปิดมุมมอง Zoom
function openZoomView(index) {
    const zoomOverlay = document.getElementById('zoom-overlay');
    const zoomImage = document.getElementById('zoom-image');
    const zoomCounter = document.getElementById('zoom-counter');

    if (zoomOverlay && zoomImage && currentProduct && currentProduct.images) {
        currentImageIndex = index;
        zoomImage.src = currentProduct.images[currentImageIndex];

        if (zoomCounter) {
            zoomCounter.textContent = `${currentImageIndex + 1} / ${totalImages}`;
        }

        zoomOverlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

// ปิดมุมมอง Zoom
function closeZoomView() {
    const zoomOverlay = document.getElementById('zoom-overlay');
    if (zoomOverlay) {
        zoomOverlay.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// เปลี่ยนรูปในมุมมอง Zoom
function changeZoomImage(direction) {
    const newIndex = (currentImageIndex + direction + totalImages) % totalImages;
    const zoomImage = document.getElementById('zoom-image');
    const zoomCounter = document.getElementById('zoom-counter');

    if (zoomImage && currentProduct && currentProduct.images) {
        currentImageIndex = newIndex;
        zoomImage.src = currentProduct.images[currentImageIndex];

        if (zoomCounter) {
            zoomCounter.textContent = `${currentImageIndex + 1} / ${totalImages}`;
        }
    }
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

// จัดการการสั่งซื้อ
function handleOrder(sku, productName) {
    // คัดลอก SKU ไปที่คลิปบอร์ด
    copyToClipboard(sku);

    // แสดงแจ้งเตือน
    showNotification(`ຄັດລອກ "${sku}" ສຳເລັດແລ້ວ!`);

    // เปิดลิงก์สั่งซื้อ
    setTimeout(() => {
        window.open(APP_CONFIG.ORDER_LINK, '_blank');
    }, 800);
}

// คัดลอกข้อความไปที่คลิปบอร์ด
function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text);
    } else {
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

// โหลดข้อมูลสินค้าและแสดงรายละเอียด
async function loadProductDetail() {
    try {
        const response = await fetch('data.json');
        const products = await response.json();

        // หาสินค้าจาก SKU ที่ระบุใน URL
        currentProduct = products.find(p => p.sku === sku);

        if (!currentProduct) {
            showProductNotFound();
            return;
        }

        // เพิ่ม flag available
        currentProduct.available = currentProduct.preorder !== undefined ? currentProduct.preorder : (currentProduct.stock > 0);

        // แสดงรายละเอียดสินค้า
        renderProductDetail();

    } catch (error) {
        console.error('Error loading product detail:', error);
        showLoadingError();
    }
}

// แสดงข้อความเมื่อไม่พบสินค้า
function showProductNotFound() {
    productDetailContainer.innerHTML = `
        <div class="error-message" style="text-align: center; padding: 60px;">
            <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ccc; margin-bottom: 15px;"></i>
            <h3>ບໍ່ພົບສິນຄ້າທີ່ຕ້ອງການ</h3>
            <p>ສິນຄ້ານີ້ບໍ່ມີໃນລະບົບ ຫຼື ຖືກຍ້າຍໄປແລ້ວ</p>
            <a href="product.html" class="btn-back" style="margin-top: 20px; display: inline-block;">
                <i class="fas fa-arrow-left"></i> ກັບສູ່ໜ້າລາຍການ
            </a>
        </div>
    `;
}

// แสดงข้อความเมื่อโหลดข้อมูลผิดพลาด
function showLoadingError() {
    productDetailContainer.innerHTML = `
        <div class="error-message" style="text-align: center; padding: 60px;">
            <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: #ccc; margin-bottom: 15px;"></i>
            <h3>ບໍ່ສາມາດໂຫລດຂໍ້ມູນສິນຄ້າໄດ້</h3>
            <p>ກະລຸນາກວດສອບການເຊື່ອມຕໍ່ ຫຼື ໄຟລ໌ data.json</p>
            <a href="product.html" class="btn-back" style="margin-top: 20px; display: inline-block;">
                <i class="fas fa-arrow-left"></i> ກັບສູ່ໜ້າລາຍການ
            </a>
        </div>
    `;
}

// แสดงรายละเอียดสินค้า
function renderProductDetail() {
    const discount = currentProduct.sale && currentProduct.originalPrice ?
        calculateDiscount(currentProduct.originalPrice, currentProduct.price) : 0;

    const allcol = currentProduct.colors.length;
    
    // ตรวจสอบว่าสินค้าหมดหรือไม่
    const isOutOfStock = currentProduct.out === true;
    
    productDetailContainer.innerHTML = `
        <div class="product-detail">
            <div class="detail-content">
                <div class="detail-image-container">
                    ${createImageGallery(currentProduct.images || [currentProduct.image])}
                    
                    <!-- สัญลักษณ์สินค้าหมด -->
                    ${isOutOfStock ? `
                        <div class="out-of-stock-detail-overlay">
                            <div class="out-of-stock-detail-badge">ໝົດແລ້ວ</div>
                            <div class="out-of-stock-detail-text">ສິນຄ້ານີ້ໝົດສະຕ໋ອກແລ້ວ</div>
                        </div>
                    ` : ''}
                </div>
                
                <div class="detail-info">
                    <!-- Badges สำหรับ preorder และ sale -->
                    <div class="product-badges-detail">
                        ${isOutOfStock ? '<span class="badge out-stock-detail"><i class="fas fa-ban"></i> ໝົດສິນຄ້າ</span>' : ''}
                        ${!isOutOfStock && currentProduct.preorder ? '<span class="badge preorder"><i class="fas fa-clock"></i> ພຣີອໍເດີ້</span>' : ''}
                        ${!isOutOfStock && currentProduct.sale ? `<span class="badge sale"><i class="fas fa-tag"></i> ລາຄາພິເສດ</span>` : ''}
                    </div>
                    
                    <div class="detail-category">${currentProduct.category || 'ບໍ່ມີຂໍ້ມູນ'}</div>
                    <h1 class="detail-name ${isOutOfStock ? 'out-of-stock-title' : ''}">
                        ${currentProduct.name}
                        ${isOutOfStock ? '<span class="status-emoji">❌</span>' : ''}
                    </h1>
                    
                    <!-- ข้อความแจ้งเตือนสินค้าหมด -->
                    ${isOutOfStock ? `
                        <div class="out-of-stock-alert">
                            <i class="fas fa-exclamation-triangle"></i>
                            <div>
                                <strong>ສິນຄ້ານີ້ໝົດສະຕ໋ອກແລ້ວ</strong>
                                <p>ທ່ານຍັງສາມາດຊົມລາຍລະອຽດຂອງສິນຄ້າໄດ້ ແຕ່ບໍ່ສາມາດສັ່ງຊື້ໄດ້ໃນຂະນະນີ້</p>
                            </div>
                        </div>
                    ` : ''}
                    
                    <!-- Price with discount -->
                    <div class="detail-price-container ${isOutOfStock ? 'out-of-stock-price' : ''}">
                        <div class="detail-price">
                            ${formatPrice(currentProduct.price)} ${APP_CONFIG.CURRENCY}
                            ${currentProduct.sale && currentProduct.originalPrice ? `
                                <span class="detail-original-price">
                                    ${formatPrice(currentProduct.originalPrice)} ${APP_CONFIG.CURRENCY}
                                </span>
                            ` : ''}
                        </div>
                        ${!isOutOfStock && currentProduct.sale && currentProduct.originalPrice ? `
                            <div class="detail-discount">
                                ຫຼຸດສ່ວນ ${discount}%
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="detail-sku">SKU: <span style="color: blue; font-weight: 600;">${currentProduct.sku}</span></div>
                    
                    <!-- Stock info -->
                    <div class="detail-stock-info ${isOutOfStock ? 'out-of-stock-info' : ''}">
                        ${isOutOfStock ? `
                            <i class="fas fa-ban error"></i>
                            <span class="error-text">ສິນຄ້າໝົດແລ້ວ</span>
                        ` : currentProduct.preorder ? `
                            <i class="fas fa-clock preorder-icon"></i>
                            <span class="preorder-text">ພຣີອໍເດີ້ 7-10 ມື້</span>
                        ` : `
                            <i class="fas ${currentProduct.stock > 0 ? 'fa-check-circle success' : 'fa-times-circle error'}"></i>
                            <span>${currentProduct.stock > 0 ? 'ມີຈຳນວນ' : 'ໝົດສິນຄ້າ'}</span>
                            ${currentProduct.stock ? `<span class="stock-count">(${currentProduct.stock} ຊິ້ນ)</span>` : ''}
                        `}
                    </div>
                    
                    <p class="detail-description">${currentProduct.description || 'ບໍ່ມີລາຍລະອຽດ'}</p>
                    
                    <div class="detail-specs-grid">
                        <div class="spec-card ${isOutOfStock ? 'out-of-stock-card' : ''}">
                            <h4><i class="fas fa-ruler"></i> Size (ຂະຫນາດ)</h4>
                            <div class="sizes-container">
                                ${(currentProduct.sizes || ['ບໍ່ມີຂໍ້ມູນ']).map(size => `<span class="size-item">${size}</span>`).join('')}
                            </div>
                        </div>
                        
                        <div class="spec-card ${isOutOfStock ? 'out-of-stock-card' : ''}">
                            <h4><i class="fas fa-palette"></i> ສີທີມີ <span style="  
                            background: #ff9800;
                            color: #fff;
                            padding: 2px 10px;
                            border-radius: 20px;
                            font-size: 14px;
                            font-weight: bold;"
                            >(${allcol})</span> </h4>
                            <div class="colors-container">
                                ${(currentProduct.colors || ['ບໍ່ມີຂໍ້ມູນ']).map(color => `
                                    <span class="color-item" style="border:2px solid black; background-color:rgba(205, 209, 210, 1);">
                                        ${color}
                                    </span>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                    
                    <!-- Details -->
                    ${currentProduct.details && currentProduct.details.length > 0 ? `
                        <div class="detail-specs ${isOutOfStock ? 'out-of-stock-details' : ''}">
                            <h3><i class="fas fa-info-circle"></i> ລາຍລະອຽດເພີ່ມເຕີມ</h3>
                            <div class="details-container">
                                ${currentProduct.details.map(detail => `
                                    <div class="detail-item">
                                        <i class="fas fa-angle-right"></i>
                                        <span>${detail}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    <!-- Alternative products suggestion for out of stock -->
                   
                    
                    <div class="detail-actions">
                        <button class="btn-back" onclick="window.location.href='index.html'">
                            <i class="fas fa-arrow-left"></i> ກັບຫນ້າລາຍການ
                        </button>
                        ${isOutOfStock ? `
                            <button class="btn-order-detail out-of-stock-btn" onclick="handleOutOfStockAction()">
                                <i class="fas fa-info-circle"></i> ເບິ່ງລາຍລະອຽດ
                            </button>
                        ` : `
                            <button class="btn-order-detail" onclick="handleOrder('${currentProduct.sku}', '${currentProduct.name}')">
                                <i class="fas fa-shopping-cart"></i> 
                                ${currentProduct.preorder ? 'ສອບຖາມ -​ ສັ່ງຊື້ ຄລິກ!' : 'ສອບຖາມ -​ ສັ່ງຊື້ ຄລິກ!'}
                            </button>
                        `}
                    </div>
                </div>
            </div>
        </div>
    `;

    // ซ่อน loading state
    const loadingElement = document.querySelector('.loading');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }

    // อัปเดตปุ่มเลื่อนหลังจากสร้างแกลเลอรี่แล้ว
    setTimeout(updateNavButtons, 100);

    // เพิ่ม Event Listener สำหรับปุ่ม ESC เพื่อปิด zoom
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            closeZoomView();
        }

        // การควบคุมแกลเลอรี่ด้วยปุ่มลูกศร
        const zoomOverlay = document.getElementById('zoom-overlay');
        if (zoomOverlay && zoomOverlay.style.display === 'flex') {
            if (e.key === 'ArrowLeft') {
                changeZoomImage(-1);
            } else if (e.key === 'ArrowRight') {
                changeZoomImage(1);
            }
        } else {
            if (e.key === 'ArrowLeft') {
                changeImage(-1);
            } else if (e.key === 'ArrowRight') {
                changeImage(1);
            }
        }
    });

    // Add click event for zoom overlay
    const zoomOverlay = document.getElementById('zoom-overlay');
    if (zoomOverlay) {
        zoomOverlay.addEventListener('click', function (e) {
            if (e.target === this) {
                closeZoomView();
            }
        });
    }
}

// ฟังก์ชันสำหรับการจัดการเมื่อสินค้าหมด
function handleOutOfStockAction() {
    // แจ้งเตือนว่าเป็นสินค้าหมด
    showNotification(`ສິນຄ້ານີ້ໝົດແລ້ວ, ກະລຸນາລອງເບິ່ງສິນຄ້າອື່ນ!`);
    
    // คัดลอก SKU ไปที่คลิปบอร์ด (สำหรับกรณีที่ลูกค้าต้องการสอบถาม)
    copyToClipboard(currentProduct.sku);
    
    // เปิดลิงก์สำหรับสอบถามเกี่ยวกับสินค้าที่หมด
    setTimeout(() => {
        // สร้างข้อความสำหรับสอบถามสินค้าหมด
        const message = `ສະບາຍດີ, ຂ້ອຍສົນໃຈສິນຄ້າ ${currentProduct.name} (SKU: ${currentProduct.sku}) ແຕ່ໝົດແລ້ວ, ມີເວລາໃດຈະມີໃຫມ່ອີກ?`;
        const encodedMessage = encodeURIComponent(message);
        
        // เปิดลิงก์ Messenger พร้อมข้อความ
        window.open(`https://m.me/somsyonlineshop?text=${encodedMessage}`, '_blank');
    }, 1000);
}

// จัดการการสั่งซื้อ - แก้ไขให้รองรับสินค้าหมด
function handleOrder(sku, productName) {
    // ถ้าสินค้าหมด ให้ใช้ฟังก์ชันสำหรับสินค้าหมดแทน
    if (currentProduct && currentProduct.out === true) {
        handleOutOfStockAction();
        return;
    }
    
    // สำหรับสินค้าที่ยังมี (โค้ดเดิม)
    copyToClipboard(sku);
    showNotification(`ຄັດລອກ "${sku}" ສຳເລັດແລ້ວ!`);
    
    setTimeout(() => {
        window.open(APP_CONFIG.ORDER_LINK, '_blank');
    }, 800);
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

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            menuToggle.classList.remove('active');
        });
    });

    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            if (!navMenu.contains(e.target) && !menuToggle.contains(e.target)) {
                navMenu.classList.remove('active');
                menuToggle.classList.remove('active');
            }
        }
    });

    window.addEventListener('scroll', () => {
        if (window.innerWidth <= 768) {
            navMenu.classList.remove('active');
            menuToggle.classList.remove('active');
        }
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            navMenu.classList.remove('active');
            menuToggle.classList.remove('active');
        }
    });
}

// เริ่มต้นแอปพลิเคชัน
function initializeApp() {
    createNotification();
    if (sku) {
        loadProductDetail();
    } else {
        showProductNotFound();
    }
}

// เริ่มต้นแอปพลิเคชันเมื่อโหลดหน้าเว็บเสร็จ
document.addEventListener('DOMContentLoaded', initializeApp);