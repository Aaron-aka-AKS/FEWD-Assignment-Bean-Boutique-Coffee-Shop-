/* Bean Boutique - shared JavaScript */
document.addEventListener("DOMContentLoaded", () => {
    const $ = (s, root = document) => root.querySelector(s);
    const $$ = (s, root = document) => [...root.querySelectorAll(s)];
    const money = n => `£${n.toFixed(2)}`;
    const get = key => localStorage.getItem(key);

    /* Theme and mobile menu */
    const theme = $("#themeButton"), menu = $("#menuButton"), nav = $("#mainNavigation");
    const updateTheme = () => {
        const dark = document.documentElement.classList.contains("dark-mode");
        if (!theme) return;
        theme.innerHTML = `<i class="fas fa-${dark ? "sun" : "moon"}" aria-hidden="true"></i>`;
        theme.setAttribute("aria-label", `Switch to ${dark ? "light" : "dark"} mode`);
        theme.setAttribute("aria-pressed", String(dark));
    };

    document.documentElement.classList.toggle("dark-mode", get("beanTheme") === "dark");
    updateTheme();

    theme?.addEventListener("click", () => {
        document.documentElement.classList.toggle("dark-mode");
        localStorage.setItem("beanTheme", document.documentElement.classList.contains("dark-mode") ? "dark" : "light");
        updateTheme();
    });

    const toggleMenu = open => {
        if (!nav || !menu) return;
        nav.classList.toggle("show", open);
        menu.setAttribute("aria-expanded", String(open));
        menu.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
        $("i", menu).className = open ? "fas fa-times" : "fas fa-bars";
    };

    menu?.addEventListener("click", () => toggleMenu(!nav.classList.contains("show")));
    $$("#mainNavigation a").forEach(a => a.addEventListener("click", () => toggleMenu(false)));


    /* Home and Offers slideshows */
    function slideshow(holder, trackSelector, slideSelector, dotSelector, prevId, nextId, delay) {
        if (!holder) return;

        const track = $(trackSelector, holder);
        const slides = $$(slideSelector, holder);
        const dots = $$(dotSelector);

        if (!track || !slides.length) return;

        const reduced = matchMedia("(prefers-reduced-motion: reduce)");
        let index = 0, timer;

        const show = n => {
            index = (n + slides.length) % slides.length;
            track.style.transform = `translateX(-${index * 100}%)`;

            slides.forEach((slide, i) => {
                slide.inert = i !== index;
                slide.setAttribute("aria-hidden", String(i !== index));
            });

            dots.forEach((dot, i) => {
                dot.classList.toggle("active", i === index);
                dot.setAttribute("aria-pressed", String(i === index));
            });
        };

        const stop = () => clearInterval(timer);

        const start = () => {
            stop();

            if (slides.length > 1 && !reduced.matches && !document.hidden &&
                !holder.matches(":hover") && !holder.contains(document.activeElement))
                timer = setInterval(() => show(index + 1), delay);
        };

        $(prevId)?.addEventListener("click", () => {
            show(index - 1);
            start();
        });

        $(nextId)?.addEventListener("click", () => {
            show(index + 1);
            start();
        });

        dots.forEach((dot, i) => dot.addEventListener("click", () => {
            show(i);
            start();
        }));

        holder.addEventListener("mouseenter", stop);
        holder.addEventListener("mouseleave", start);
        holder.addEventListener("focusin", stop);
        holder.addEventListener("focusout", e => {
            if (!holder.contains(e.relatedTarget)) start();
        });

        document.addEventListener("visibilitychange", start);
        reduced.addEventListener("change", start);

        show(0);
        start();
    }

    slideshow($(".featured-slideshow"), ".featured-track", ".featured-slide", ".featured-dot",
        "#featuredPrev", "#featuredNext", 4000);

    slideshow($("#promotionSlider"), ".promotion-track", ".promotion-slide", ".promotion-dot",
        "#promotionPrev", "#promotionNext", 5000);


    /* Welcome discount popup */
    const modal = $("#welcomeModal"), welcomeForm = $("#discountForm");
    let oldFocus;

    const closeModal = () => {
        modal?.classList.remove("show");
        sessionStorage.setItem("welcomeDismissed", "true");
        oldFocus?.focus();
    };

    if (modal && !get("beanWelcomeClaimed") && !sessionStorage.getItem("welcomeDismissed")) {
        setTimeout(() => {
            oldFocus = document.activeElement;
            modal.classList.add("show");
            $("#discountEmail")?.focus();
        }, 1200);
    }

    $("#closeModal")?.addEventListener("click", closeModal);

    modal?.addEventListener("keydown", e => {
        if (e.key === "Escape") return closeModal();
        if (e.key !== "Tab") return;

        const focusable = $$("button:not(:disabled), input:not(:disabled)", modal);
        if (!focusable.length) return;

        if (e.shiftKey && document.activeElement === focusable[0]) {
            e.preventDefault();
            focusable.at(-1).focus();
        } else if (!e.shiftKey && document.activeElement === focusable.at(-1)) {
            e.preventDefault();
            focusable[0].focus();
        }
    });

    welcomeForm?.addEventListener("submit", e => {
        e.preventDefault();
        if (!welcomeForm.reportValidity()) return;

        localStorage.setItem("beanWelcomeClaimed", "true");
        $("#welcomeCode").hidden = false;
        $("#discountMessage").textContent = "Use WELCOME10 at checkout (demo only).";
    });


    /* AOS and MixItUp plugins */
    if (window.AOS) AOS.init({
        duration: 650,
        once: true,
        disable: matchMedia("(prefers-reduced-motion: reduce)").matches
    });
    else $$("[data-aos]").forEach(el => el.removeAttribute("data-aos"));

    const catalogue = $("#coffeeCatalogue"), search = $("#coffeeSearch");

    if (catalogue) {
        const cards = $$(".coffee-card", catalogue);
        const buttons = $$(".filter-buttons button");
        let category = "all", mixer;

        if (window.mixitup) {
            try {
                mixer = mixitup(catalogue, { animation: { duration: 300 } });
            } catch (error) {
                console.warn("MixItUp unavailable:", error);
            }
        }

        const filter = () => {
            const term = (search?.value || "").trim().toLowerCase();
            let count = 0;

            cards.forEach(card => {
                const matches = (category === "all" || card.matches(category)) &&
                    (card.dataset.search || card.textContent).toLowerCase().includes(term);

                card.classList.toggle("search-match", matches);
                if (!mixer) card.hidden = !matches;
                if (matches) count++;
            });

            if (mixer)
                mixer.filter(".search-match")
                    .then(() => window.AOS?.refresh?.())
                    .catch(() => {
                        mixer = null;
                        cards.forEach(c => c.hidden = !c.classList.contains("search-match"));
                    });

            $("#searchHint").textContent = term || category !== "all"
                ? `${count} product(s) found.`
                : "Start typing to search.";
        };

        search?.addEventListener("input", filter);

        buttons.forEach(button => button.addEventListener("click", () => {
            category = button.dataset.filter;

            buttons.forEach(b => {
                b.classList.toggle("active", b === button);
                b.setAttribute("aria-pressed", String(b === button));
            });

            filter();
        }));

        filter();

        /* Animated search suggestions */
        if (search && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
            const names = ["Golden Orchard", "Forest Ember", "Ethiopia Bloom"];
            let word = 0, letter = 0;

            setInterval(() => {
                if (search.value || document.activeElement === search || document.hidden) return;

                const hint = `Search ${names[word]}...`;
                search.placeholder = hint.slice(0, letter++);

                if (letter > hint.length + 6) {
                    letter = 0;
                    word = (word + 1) % names.length;
                }
            }, 140);
        }
    }


    /* Shopping cart and receipt */
    let cart = [];

    try {
        const saved = JSON.parse(get("beanCart") || "[]");

        if (Array.isArray(saved))
            cart = saved.filter(p =>
                typeof p.name === "string" &&
                Number.isFinite(+p.price) && +p.price >= 0 &&
                Number.isInteger(+p.quantity) && +p.quantity > 0
            ).map(p => ({
                name: p.name,
                price: +p.price,
                quantity: +p.quantity
            }));
    } catch {
        cart = [];
    }

    const escape = s => String(s).replace(/[&<>"']/g, c =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;",
           '"': "&quot;", "'": "&#39;" })[c]);

    const discountActive = () =>
        get("beanDiscountApplied") === "true" &&
        get("beanWelcomeClaimed") === "true" &&
        get("beanWelcomeUsed") !== "true";

    const badge = () => {
        const count = cart.reduce((n, p) => n + p.quantity, 0);

        $$(".cart-badge").forEach(b => {
            b.textContent = count;
            b.classList.toggle("hidden", !count);
            b.setAttribute("aria-label", `${count} items in cart`);
        });
    };

    const render = () => {
        badge();

        const items = $("#cartItems");
        if (!items) return;

        items.innerHTML = cart.length ? cart.map((p, i) => `
            <article class="card cart-item">
                <div class="cart-item-info">
                    <h3>${escape(p.name)}</h3>
                    <p>Price: ${money(p.price)}</p>
                    <p>Subtotal: ${money(p.price * p.quantity)}</p>
                </div>

                <div class="cart-item-controls">
                    <button type="button" class="quantity-button minus-button"
                        data-index="${i}" aria-label="Decrease quantity">−</button>

                    <span class="quantity-number">${p.quantity}</span>

                    <button type="button" class="quantity-button plus-button"
                        data-index="${i}" aria-label="Increase quantity">+</button>
                </div>

                <button type="button" class="button remove-cart"
                    data-index="${i}">Remove</button>
            </article>
        `).join("") :
            '<article class="card"><p>Your cart is currently empty.</p>' +
            '<a href="coffee.html" class="button">Continue Shopping</a></article>';

        $("#receiptItems").innerHTML = cart.length ? cart.map(p => `
            <tr>
                <td data-label="Product">${escape(p.name)}</td>
                <td data-label="Price">${money(p.price)}</td>
                <td data-label="Quantity">${p.quantity}</td>
                <td data-label="Subtotal">${money(p.price * p.quantity)}</td>
            </tr>
        `).join("") :
            '<tr><td colspan="4" class="receipt-empty">Your receipt is empty.</td></tr>';

        const count = cart.reduce((n, p) => n + p.quantity, 0);
        const subtotal = cart.reduce((n, p) => n + p.price * p.quantity, 0);
        const discount = discountActive() ? subtotal * 0.1 : 0;

        $("#cartItemCount").textContent = count;
        $("#cartSubtotal").textContent = money(subtotal);
        $("#cartDiscountAmount").textContent = `−${money(discount)}`;
        $("#cartTotal").textContent = money(subtotal - discount);
        $("#cartDiscountRow").hidden = !discount;
    };

    const save = () => {
        localStorage.setItem("beanCart", JSON.stringify(cart));
        render();
    };

    $$(".add-to-cart").forEach(button => button.addEventListener("click", () => {
        const name = button.dataset.name;
        const price = Number(button.dataset.price);

        if (!name || !Number.isFinite(price) || price < 0) return;

        const existing = cart.find(p => p.name === name && p.price === price);

        if (existing) existing.quantity++;
        else cart.push({ name, price, quantity: 1 });

        save();
        alert(`${name} added to cart.`);
    }));

    $("#cartItems")?.addEventListener("click", e => {
        const button = e.target.closest("button[data-index]");
        if (!button) return;

        const i = Number(button.dataset.index);
        if (!cart[i]) return;

        if (button.classList.contains("plus-button")) cart[i].quantity++;
        if (button.classList.contains("minus-button")) cart[i].quantity--;

        if (button.classList.contains("remove-cart") || cart[i].quantity < 1)
            cart.splice(i, 1);

        save();
    });

    $("#cartDiscountForm")?.addEventListener("submit", e => {
        e.preventDefault();

        const message = $("#cartDiscountMessage");
        const code = $("#cartDiscountCode").value.trim().toUpperCase();

        if (!cart.length)
            message.textContent = "Add a product first.";
        else if (get("beanWelcomeUsed") === "true")
            message.textContent = "Discount already used.";
        else if (get("beanWelcomeClaimed") !== "true" || code !== "WELCOME10")
            message.textContent = "Invalid welcome code.";
        else {
            localStorage.setItem("beanDiscountApplied", "true");
            message.textContent = "10% discount applied.";
            render();
        }
    });

    $("#confirmOrderButton")?.addEventListener("click", () => {
        const message = $("#checkoutMessage");

        if (!cart.length) {
            message.textContent = "Your cart is empty.";
            return;
        }

        if (discountActive())
            localStorage.setItem("beanWelcomeUsed", "true");

        localStorage.removeItem("beanDiscountApplied");
        cart = [];
        localStorage.setItem("beanCart", "[]");

        badge();

        $("#cartItems").innerHTML =
            '<article class="card"><p>Your cart is currently empty.</p></article>';

        message.textContent =
            "Demo order completed. No payment was collected.";
    });


    /* Coffee subscriptions */
    $$(".subscription-button").forEach(button => button.addEventListener("click", () => {
        $$(".subscription-card").forEach(card => {
            card.classList.remove("selected");

            const b = $(".subscription-button", card);
            b.textContent = `Choose ${b.dataset.plan}`;
            b.setAttribute("aria-pressed", "false");
        });

        button.closest(".subscription-card").classList.add("selected");
        button.textContent = "Selected";
        button.setAttribute("aria-pressed", "true");

        $("#subscriptionMessage").textContent =
            `${button.dataset.plan} plan selected.`;
    }));


    /* Event selection and email registration */
    const eventForm = $("#eventRegistration");
    const eventMessage = $("#eventMessage");
    const events = $$('.event-card input[name="selectedEvent"]');

    const updateEvents = () => {
        const d = new Date();
        const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

        events.forEach(radio => {
            radio.disabled = !!radio.dataset.eventDate &&
                radio.dataset.eventDate <= today;

            if (radio.disabled) radio.checked = false;

            const card = radio.closest(".event-card");
            card.classList.toggle("expired", radio.disabled);

            if (radio.disabled) card.classList.remove("selected");
        });
    };

    updateEvents();

    events.forEach(radio => {
        const card = radio.closest(".event-card");

        card.addEventListener("click", e => {
            if (radio.disabled || e.target.closest("input, label, a, button"))
                return;

            radio.checked = true;
            radio.dispatchEvent(new Event("change", { bubbles: true }));
        });

        radio.addEventListener("change", () => {
            $$(".event-card").forEach(c => c.classList.remove("selected"));

            if (radio.checked && !radio.disabled)
                card.classList.add("selected");

            eventMessage.textContent = "";
        });
    });

    eventForm?.addEventListener("submit", e => {
        e.preventDefault();
        updateEvents();

        const chosen = events.find(r => r.checked && !r.disabled);

        eventMessage.classList.remove(
            "event-message-error", "event-message-success"
        );

        if (!chosen) {
            eventMessage.textContent = "Please select an available event.";
            eventMessage.classList.add("event-message-error");
            return;
        }

        if (!eventForm.reportValidity()) return;

        const recipient = eventForm.dataset.bookingEmail;

        if (!recipient) {
            eventMessage.textContent =
                "Demo form checked. Configure data-booking-email to send a request.";
        } else {
            const data = new FormData(eventForm);

            const body = [
                `Event: ${chosen.value}`,
                `Date: ${chosen.dataset.eventDate}`,
                `Name: ${data.get("firstName")} ${data.get("lastName")}`,
                `Email: ${data.get("email")}`,
                `Guests: ${data.get("guestNumber")}`,
                `Attendance: ${data.get("attendance")}`,
                `Request: ${data.get("specialRequest") || "None"}`
            ].join("\n");

            location.href =
                `mailto:${recipient}?subject=${encodeURIComponent("Bean Boutique event registration")}&body=${encodeURIComponent(body)}`;

            eventMessage.textContent =
                "Your email app should open. Send the email to request a place.";
        }

        eventMessage.classList.add("event-message-success");
    });

    render();
});