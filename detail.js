// ค่าคงที่สำหรับแอปพลิเคชัน
const APP_CONFIG = {
    ORDER_LINK: "https://line.me/R/oaMessage/@shop123/",
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
// --- ສ່ວນທີ່ປັບປຸງໃນ Logic Gallery ---

function createImageGallery(images) {
    // ຈຳກັດຮູບບໍ່ໃຫ້ເກີນ 8 ຮູບ (ຖ້າມີເກີນຈະຕັດອອກ)
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
                <div class="thumbnail-container" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 10px;">
                    ${displayImages.map((img, index) => `
                        <div class="thumbnail ${index === 0 ? 'active' : ''}" 
                             onclick="selectImage(${index})" 
                             data-index="${index}"
                             style="aspect-ratio: 1/1; overflow: hidden; border-radius: 4px; cursor: pointer; border: 2px solid transparent;">
                            <img src="${img}" alt="Thumbnail ${index + 1}" style="width: 100%; height: 100%; object-fit: cover;">
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

// ປັບປຸງ Function selectImage ໃຫ້ຮອງຮັບການປ່ຽນຮູບ Zoom ໄດ້ພ້ອມ
function selectImage(index) {
    if (index < 0 || index >= totalImages) return;
    currentImageIndex = index;
    
    const mainImage = document.getElementById('main-image');
    const zoomImage = document.getElementById('zoom-image'); // ເພີ່ມການອັບເດດຮູບຊູມ
    
    if (mainImage && currentProduct && currentProduct.images) {
        const targetImg = currentProduct.images[currentImageIndex];
        mainImage.src = targetImg;
        if(zoomImage) zoomImage.src = targetImg;
        
        const imageCounter = document.querySelector('.main-image-container .image-counter');
        const zoomCounter = document.getElementById('zoom-counter');
        
        if (imageCounter) imageCounter.textContent = `${currentImageIndex + 1} / ${totalImages}`;
        if (zoomCounter) zoomCounter.textContent = `${currentImageIndex + 1} / ${totalImages}`;
        
        const thumbnails = document.querySelectorAll('.thumbnail');
        thumbnails.forEach((thumb, i) => {
            thumb.classList.toggle('active', i === currentImageIndex);
            // ປ່ຽນ Style ໃຫ້ເຫັນຊັດເຈນວ່າກຳລັງເລືອກຮູບໃດ
            thumb.style.borderColor = (i === currentImageIndex) ? 'var(--primary-color, #ff4757)' : 'transparent';
        });
        
        updateNavButtons();
    }
}
// เปลี่ยนรูปหลักในแกลเลอรี่
function changeImage(direction) {
    const newIndex = (currentImageIndex + direction + totalImages) % totalImages;
    selectImage(newIndex);
}

// เลือกรูปจาก thumbnail
function selectImage(index) {
    currentImageIndex = index;
    
    // อัปเดตรูปหลัก
    const mainImage = document.getElementById('main-image');
    if (mainImage && currentProduct && currentProduct.images) {
        mainImage.src = currentProduct.images[currentImageIndex];
        
        // อัปเดต image counter
        const imageCounter = document.querySelector('.main-image-container .image-counter');
        if (imageCounter) {
            imageCounter.textContent = `${currentImageIndex + 1} / ${totalImages}`;
        }
        
        // อัปเดต thumbnail ที่ active
        const thumbnails = document.querySelectorAll('.thumbnail');
        thumbnails.forEach((thumb, i) => {
            if (i === currentImageIndex) {
                thumb.classList.add('active');
            } else {
                thumb.classList.remove('active');
            }
        });
        
        // อัปเดตปุ่มเลื่อน
        updateNavButtons();
    }
}

// อัปเดตสถานะปุ่มเลื่อน
function updateNavButtons() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    
    if (prevBtn && nextBtn) {
        // ปุ่ม Previous ถูกปิดเมื่ออยู่ที่รูปแรก
        prevBtn.disabled = currentImageIndex === 0;
        
        // ปุ่ม Next ถูกปิดเมื่ออยู่ที่รูปสุดท้าย
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

// โหลดข้อมูลสินค้าและแสดงรายละเอียด
async function loadProductDetail() {
    try {
        const response = await fetch('data.json');
        const products = await response.json();
        
        // หาสินค้าจาก SKU ที่ระบุใน URL
        currentProduct = products.find(p => p.sku === sku);
        
        if (!currentProduct) {
            productDetailContainer.innerHTML = `
                <div class="error-message" style="text-align: center; padding: 60px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ccc; margin-bottom: 15px;"></i>
                    <h3>ບໍ່ພົບສິນຄ້າທີ່ຕ້ອງການ</h3>
                    <p>ສິນຄ້ານີ້ບໍ່ມີໃນລະບົບ ຫຼື ຖືກຍ້າຍໄປແລ້ວ</p>
                    <a href="index.html" class="btn-back" style="margin-top: 20px; display: inline-block;">
                        <i class="fas fa-arrow-left"></i> ກັບສູ່ໜ້າຫຼັກ
                    </a>
                </div>
            `;
            return;
        }
        
        // แสดงรายละเอียดสินค้า
        renderProductDetail();
        
    } catch (error) {
        console.error('Error loading product detail:', error);
        productDetailContainer.innerHTML = `
            <div class="error-message" style="text-align: center; padding: 60px;">
                <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: #ccc; margin-bottom: 15px;"></i>
                <h3>ບໍ່ສາມາດໂຫລດຂໍ້ມູນສິນຄ້າໄດ້</h3>
                <p>ກະລຸນາກວດສອບການເຊື່ອມຕໍ່ ຫຼື ໄຟລ໌ data.json</p>
                <a href="index.html" class="btn-back" style="margin-top: 20px; display: inline-block;">
                    <i class="fas fa-arrow-left"></i> ກັບສູ່ໜ້າຫຼັກ
                </a>
            </div>
        `;
    }
}

// แสดงรายละเอียดสินค้า
function renderProductDetail() {
    productDetailContainer.innerHTML = `
        <div class="product-detail">
            <div class="detail-content">
                <div class="detail-image-container">
                    ${createImageGallery(currentProduct.images)}
                </div>
                
                <div class="detail-info">
                    <div class="detail-category">${currentProduct.category}</div>
                    <h1 class="detail-name">${currentProduct.name}</h1>
                    <div class="detail-price">${formatPrice(currentProduct.price)}</div>
                    <div class="detail-sku">SKU: <span  style="color: blue;">${currentProduct.sku}</span> </div>
                    
                    <p class="detail-description">${currentProduct.description}</p>
                    
                    <div class="detail-specs-grid">
                        <div class="spec-card">
                            <h4><i class="fas fa-ruler"></i>Size (ຂະຫນາດ)</h4>
                            <div class="sizes-container">
                                ${currentProduct.sizes.map(size => `<span class="size-item">${size}</span>`).join('')}
                            </div>
                        </div>
                        
                        <div class="spec-card">
                            <h4><i class="fas fa-palette"></i> ສີທີມີ</h4>
                            <div class="colors-container">
                                ${currentProduct.colors.map(color => `<span class="color-item">${color}</span>`).join('')}
                            </div>
                        </div>
                    </div>
                    
                    <div class="detail-specs">
                        <h3>ລາຍລະອຽດເພີ່ມເຕີມ</h3>
                        <div style="background-color: var(--light-gray); padding: 20px; border-radius: 8px; margin-top: 10px;">
                            <p><strong>ເລກທີສິນຄ້າ:</strong> ${currentProduct.sku}</p>
                            <p><strong>ຈຳນວນຮູບ:</strong> ${currentProduct.images.length} ຮູບ</p>
                            <p><strong>ຫມວດສິນຄ້າ:</strong> ${currentProduct.category}</p>
                        </div>
                    </div>
                    
                    <div class="detail-actions">
                        <button class="btn-back" onclick="window.location.href='index.html'">
                            <i class="fas fa-arrow-left"></i> ກັບຫນ້າລາຍການ
                        </button>
                        <button class="btn-order-detail" onclick="handleOrder('${currentProduct.sku}', '${currentProduct.name}')">
                            <i class="fas fa-shopping-cart"></i> ສັ່ງຊື້ຜ່ານ LINE
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // อัปเดตปุ่มเลื่อนหลังจากสร้างแกลเลอรี่แล้ว
    updateNavButtons();
    
    // เพิ่ม Event Listener สำหรับปุ่ม ESC เพื่อปิด zoom
    document.addEventListener('keydown', function(e) {
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
}

// จัดรูปแบบราคา
function formatPrice(price) {
    // ถ้าราคามีทศนิยมให้แสดงเป็น Kip
    if (typeof price === 'number') {
        return price.toLocaleString('lo-LA') + ' ₭';
    }
    return price + ' ₭';
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

// เริ่มต้นแอปพลิเคชัน
function initializeApp() {
    createNotification();
    loadProductDetail();
}



// เริ่มต้นแอปพลิเคชันเมื่อโหลดหน้าเว็บเสร็จ
document.addEventListener('DOMContentLoaded', initializeApp);


 const menuToggle = document.getElementById('menuToggle');
        const navMenu = document.getElementById('navMenu');
        const navLinks = document.querySelectorAll('.nav-link');

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
        