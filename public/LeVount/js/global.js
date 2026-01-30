function openUserMenu() {
    document.getElementById('userDrawer').classList.toggle('Open');
    document.getElementById('userOverlay').classList.toggle('Open');
}

function openLateralMenu() {
    let buttonMenu = document.getElementById("menuButton1");
    let lateralMenu = document.getElementsByClassName("bottomContainer")[0];
    let drawer = document.getElementById("menuDrawer");

    if (lateralMenu.classList.contains("Open")) {
        lateralMenu.classList.remove("Open");
        drawer.classList.remove("Open");
        buttonMenu.innerHTML=`&#xe1010;`;
    } else {
        lateralMenu.classList.add("Open");
        drawer.classList.add("Open");
        buttonMenu.innerHTML=`&#xe1014;`;
    }
}

function showPass(element) {
    let passInput = element.parentElement.children[1];

    if (passInput.type == "password") {
        passInput.type = "text";
        element.innerHTML="&#xe10ee;";
    } else {
        passInput.type = "password";
        element.innerHTML="&#xe10ed;";
    }
}

window.addEventListener("scroll", function () {
    const navbar = document.getElementsByClassName("upperContainer")[0];
    if (window.scrollY > 0) {
        navbar.classList.add("Scrolled");
    } else {
        navbar.classList.remove("Scrolled");
    }

    const parallaxImg = document.querySelector('.parallax-img');
    const section = document.querySelector('.editorial');
    
    if (section) {
        const rect = section.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

        if (isVisible) {
            const speed = 0.15;
            const yPos = (window.scrollY - section.offsetTop) * speed;
            
            parallaxImg.style.transform = `translateY(${yPos}px)`;
        }
    }    
});

document.addEventListener("DOMContentLoaded", function() {  
    const observerOptions = {
        root: null, // usa el viewport del navegador
        rootMargin: '0px',
        threshold: 0.1 // se activa cuando el 10% del elemento es visible
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target); // Dejar de observar una vez animado (para que no parpadee al subir y bajar)
        }
        });
    }, observerOptions);

    // Seleccionar todos los elementos que quieres animar
    const elements = document.querySelectorAll('.reveal-on-scroll');
    elements.forEach(el => observer.observe(el));
    const blurText = document.querySelectorAll('.text-soft-rise');
    blurText.forEach(el => observer.observe(el));
    const animTitle = document.querySelectorAll('.animatedTitle');
    animTitle.forEach(el => observer.observe(el));
});

const lenis = new Lenis({
    duration: 1.1, // Cuánto tarda en frenar (más alto = más suave)
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Curva de física
    smooth: true
});
function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

let isCartOpen = false;
let cartNeedsRefresh = true;
function toggleCart() {
    const drawer = document.getElementById('cartDrawer');
    const overlay = document.getElementById('cartOverlay');

    isCartOpen = !isCartOpen;

    if (isCartOpen) {
        drawer.classList.add('open');
        overlay.classList.add('open');

        if (cartNeedsRefresh) {
            loadCartDetails(); 
            cartNeedsRefresh = false; 
        }

    } else {
        drawer.classList.remove('open');
        overlay.classList.remove('open');
    }
}

async function loadCartDetails() {
    const container = document.getElementById('cartItemsContainer');
    const subtotalEl = document.getElementById('cartSubtotal');

    try {
        const res = await fetch(`/api/cart?cartSession=${CART_ID}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
        });
        const resJson = await res.json(); 
        
        if (resJson.items.length == 0) {
            container.children[0].innerHTML = "Your bag is empty.";
            subtotalEl.innerText = '$0.00';
        } else {
            let itemsHTML = ``;
            resJson.items.forEach(item => {
                itemsHTML += `
                    <li>
                        <img src="/images/products/${item.material}/${item.category}/${item.sku}/${item.sku.toLowerCase()}-thumb.webp" alt="" loading="lazy">
                        <i onclick="deteleCartItem('${item.sku}')">&#xe1118;</i>
                        <div class="description">
                            <div class="details">
                                <a href='/products/${item.category}/${item.sku}'>${toTitleCase(item.shortName) || toTitleCase(item.name)}</a>
                                <span>${toTitleCase(item?.material)}</span>
                                <div class="quantities">
                                <button type="button" onclick="deteleCartItem('${item?.sku}', 1)">-</button>
                                    <span class="product-badge">${item?.quantity}</span>
                                    <button type="button" onclick="addToCart('${item?.sku}', 1)">+</button>
                                </div>
                            </div>
                            <div class="price">
                                <h5>$${(item?.tagPrice != item?.finalUnitPrice) ? toCurrency(item?.tagPrice) : ''}</h5>
                                <h4>$${toCurrency(item?.finalUnitPrice)} USD</h4>
                            </div>
                        </div>        
                    </li>                
                `;
            });
            container.innerHTML = itemsHTML;
            subtotalEl.innerText = '$' + resJson.subtotal.toLocaleString('en-US', { minimumFractionDigits: 0 }) + ' USD';
        }
    } catch (error) {
        console.error(error);
        container.children[0].innerHTML = "Could not load bag. Please, try again later.";
    }
}

async function addToCart(sku, quantity) {
    try {
        const fetchUrl = (!quantity) ? `/api/cart` : `/api/cart/${quantity}`
        const res = await fetch(fetchUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ productSku: sku, quantity, cartSession: CART_ID })
        });
        const resJson = await res.json(); 
        
        if (resJson.totalItems >= 1) {
            cartNeedsRefresh = true;
            
            if(!document.getElementById("cartDrawer").className.includes("open")) {
                toggleCart();
            } else {
                loadCartDetails();
            }
        }

    } catch (error) {
        console.error(error);
    }
}

async function deteleCartItem(sku, quantity) {
    try {
        const fetchUrl = (!quantity)
            ? `/api/cart`
            : `/api/cart/${quantity}`
        const res = await fetch(fetchUrl, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json'  },
            body: JSON.stringify({ productSku: sku, quantity, cartSession: CART_ID })
        });
        const resJson = await res.json();  

        if (resJson.deletedItems > 0) {
            loadCartDetails();
        } else {
            toggleCart();
        }

    } catch (error) {
        console.error(error);
        toggleCart();
    }
}

function toTitleCase(phrase, customExceptions = []) {
    if (!phrase) return "";

    const defaultExceptions = [
        'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'if', 
        'in', 'nor', 'of', 'on', 'or', 'so', 'the', 'to', 'up', 'yet', 'with',
        'cultured', 'cultivated'
    ];
    // Combinamos las excepciones por defecto con las que tú envíes (si las hay)
    const exceptions = [...defaultExceptions, ...customExceptions];

    // 2. Convertimos todo a minúsculas y separamos por espacios
    return phrase.toLowerCase().split(' ').map((word, index) => {
        if (index === 0 || !exceptions.includes(word)) {
            return word.charAt(0).toUpperCase() + word.slice(1);
        }
        return word;
    }).join(' ');
}

function toCurrency(number) {
    try {
        return parseFloat(number).toLocaleString("es-MX");
    } catch (error) {
        throw error;
    }
}