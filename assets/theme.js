(() => {
  const root = document.documentElement;
  root.classList.remove('no-js');

  /* ── Gift finder ───────────────────────────────────── */

  const initGiftFinder = () => {
    document.querySelectorAll('[data-gift-finder]').forEach((form) => {
      form.addEventListener('submit', (event) => {
        const selectOccasion = form.querySelector('[data-finder-occasion]');
        const selectSacrament = form.querySelector('[data-finder-sacrament]');
        const destination = selectOccasion?.value || selectSacrament?.value;

        if (!destination) {
          event.preventDefault();
          return;
        }

        form.setAttribute('action', destination);
      });
    });
  };

  /* ── Product recommendations ───────────────────────── */

  const initProductRecommendations = () => {
    document.querySelectorAll('[data-product-recommendations]').forEach((container) => {
      const url = container.dataset.url;

      if (!url) {
        return;
      }

      fetch(url)
        .then((response) => response.text())
        .then((text) => {
          const html = new DOMParser().parseFromString(text, 'text/html');
          const recommendations = html.querySelector('[data-product-recommendations]');

          if (!recommendations) {
            return;
          }

          const hasProducts = recommendations.querySelector('[data-recommendation-grid]');

          if (!hasProducts) {
            return;
          }

          container.replaceChildren(...recommendations.childNodes);
        })
        .catch(() => {
          container.setAttribute('hidden', 'hidden');
        });
    });
  };

  /* ── Product details (variant picker + thumbnails) ─── */

  const initProductDetails = () => {
    document.querySelectorAll('[data-product-context]').forEach((context) => {
      const variantSelect = context.querySelector('[data-main-variant-select]');
      const stickyVariantInputs = context.querySelectorAll('[data-sticky-variant-input]');
      const addButtons = context.querySelectorAll('[data-cart-submit]');
      const livePrices = context.querySelectorAll('[data-live-price]');
      const comparePrices = context.querySelectorAll('[data-live-compare]');

      if (variantSelect) {
        const syncVariantState = () => {
          const selectedOption = variantSelect.selectedOptions[0];

          if (!selectedOption) {
            return;
          }

          const variantId = selectedOption.value;
          const variantPrice = selectedOption.dataset.price || '';
          const compareAt = selectedOption.dataset.compare || '';
          const available = selectedOption.dataset.available === 'true';

          stickyVariantInputs.forEach((input) => {
            input.value = variantId;
          });

          livePrices.forEach((node) => {
            node.textContent = variantPrice;
          });

          comparePrices.forEach((node) => {
            if (compareAt) {
              node.textContent = compareAt;
              node.hidden = false;
            } else {
              node.hidden = true;
            }
          });

          addButtons.forEach((button) => {
            button.disabled = !available;
          });
        };

        variantSelect.addEventListener('change', syncVariantState);
        syncVariantState();
      }

      const featuredImage = context.querySelector('[data-featured-image]');
      const thumbButtons = context.querySelectorAll('[data-media-thumb]');

      if (featuredImage && thumbButtons.length) {
        thumbButtons.forEach((button) => {
          button.addEventListener('click', () => {
            const source = button.dataset.src;
            const alt = button.dataset.alt || featuredImage.alt;

            if (!source) {
              return;
            }

            featuredImage.src = source;
            featuredImage.alt = alt;

            thumbButtons.forEach((thumb) => {
              thumb.setAttribute('aria-current', thumb === button ? 'true' : 'false');
            });
          });
        });
      }
    });
  };

  /* ── DOM helpers (safe rendering) ──────────────────── */

  const el = (tag, attrs, children) => {
    const node = document.createElement(tag);
    if (attrs) {
      Object.entries(attrs).forEach(([key, value]) => {
        if (key === 'textContent') {
          node.textContent = value;
        } else if (key === 'hidden') {
          node.hidden = value;
        } else if (key.startsWith('data-')) {
          node.setAttribute(key, value);
        } else if (key === 'className') {
          node.className = value;
        } else if (key === 'ariaLabel') {
          node.setAttribute('aria-label', value);
        } else if (key === 'disabled') {
          node.disabled = value;
        } else if (key === 'type') {
          node.type = value;
        } else if (key === 'href') {
          node.href = value;
        } else if (key === 'src') {
          node.src = value;
        } else if (key === 'alt') {
          node.alt = value;
        } else if (key === 'loading') {
          node.loading = value;
        } else if (key === 'style') {
          node.style.cssText = value;
        } else {
          node.setAttribute(key, value);
        }
      });
    }
    if (children) {
      children.forEach((child) => {
        if (child) node.appendChild(child);
      });
    }
    return node;
  };

  const text = (str) => document.createTextNode(str);

  /* ── Cart drawer ───────────────────────────────────── */

  const CartDrawer = (() => {
    let drawerEl = null;
    let itemsEl = null;
    let emptyEl = null;
    let footerEl = null;
    let subtotalEl = null;

    const formatMoney = (cents) => {
      return '$' + (cents / 100).toFixed(2);
    };

    const open = () => {
      if (!drawerEl) return;
      drawerEl.classList.add('is-open');
      drawerEl.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      refreshCart();
    };

    const close = () => {
      if (!drawerEl) return;
      drawerEl.classList.remove('is-open');
      drawerEl.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    };

    const updateHeaderCount = (count) => {
      document.querySelectorAll('[data-cart-count]').forEach((badge) => {
        if (count > 0) {
          badge.textContent = '(' + count + ')';
          badge.hidden = false;
        } else {
          badge.hidden = true;
        }
      });
    };

    const buildLineItem = (item) => {
      const key = item.key;

      const imgSrc = item.featured_image && item.featured_image.url
        ? item.featured_image.url.replace(/(\.\w+)(\?|$)/, '_160x200$1$2')
        : '';

      const imgNode = imgSrc
        ? el('img', {
            className: 'cart-drawer__line-image',
            src: imgSrc,
            alt: (item.featured_image.alt || item.product_title),
            loading: 'lazy'
          })
        : el('div', {
            className: 'cart-drawer__line-image',
            style: 'background:rgba(0,0,0,0.04)'
          });

      const titleNode = el('h3', { className: 'cart-drawer__line-title', textContent: item.product_title });

      const variantNode = (item.variant_title && item.variant_title !== 'Default Title')
        ? el('p', { className: 'cart-drawer__line-variant', textContent: item.variant_title })
        : null;

      const minusBtn = el('button', {
        type: 'button',
        ariaLabel: 'Decrease quantity',
        textContent: '\u2212'
      });
      minusBtn.addEventListener('click', () => {
        changeQuantity(key, Math.max(0, item.quantity - 1));
      });

      const qtyLabel = el('span', { textContent: String(item.quantity) });

      const plusBtn = el('button', {
        type: 'button',
        ariaLabel: 'Increase quantity',
        textContent: '+'
      });
      plusBtn.addEventListener('click', () => {
        changeQuantity(key, item.quantity + 1);
      });

      const qtyWrap = el('div', { className: 'cart-drawer__qty' }, [minusBtn, qtyLabel, plusBtn]);

      const priceNode = el('span', {
        className: 'cart-drawer__line-price',
        textContent: formatMoney(item.final_line_price)
      });

      const bottomRow = el('div', { className: 'cart-drawer__line-bottom' }, [qtyWrap, priceNode]);

      const removeBtn = el('button', {
        type: 'button',
        className: 'cart-drawer__line-remove',
        textContent: 'Remove'
      });
      removeBtn.addEventListener('click', () => {
        changeQuantity(key, 0);
      });

      const details = el('div', { className: 'cart-drawer__line-details' }, [
        titleNode,
        variantNode,
        bottomRow,
        removeBtn
      ]);

      return el('div', { className: 'cart-drawer__line', 'data-line-key': key }, [imgNode, details]);
    };

    const renderCart = (cart) => {
      updateHeaderCount(cart.item_count);

      if (!itemsEl || !emptyEl || !footerEl) return;

      if (cart.item_count === 0) {
        emptyEl.hidden = false;
        itemsEl.replaceChildren();
        footerEl.hidden = true;
        return;
      }

      emptyEl.hidden = true;
      footerEl.hidden = false;
      subtotalEl.textContent = formatMoney(cart.total_price);

      const fragment = document.createDocumentFragment();
      cart.items.forEach((item) => {
        fragment.appendChild(buildLineItem(item));
      });
      itemsEl.replaceChildren(fragment);
    };

    const refreshCart = () => {
      fetch('/cart.js', { credentials: 'same-origin' })
        .then((r) => r.json())
        .then(renderCart)
        .catch(() => {});
    };

    const changeQuantity = (key, quantity) => {
      fetch('/cart/change.js', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: key, quantity: quantity })
      })
        .then((r) => r.json())
        .then(renderCart)
        .catch(() => {});
    };

    const addToCart = (formData) => {
      return fetch('/cart/add.js', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: parseInt(formData.get('id'), 10),
          quantity: parseInt(formData.get('quantity'), 10) || 1
        })
      })
        .then((r) => {
          if (!r.ok) throw new Error('Add to cart failed');
          return r.json();
        })
        .then(() => {
          open();
        });
    };

    const init = () => {
      drawerEl = document.querySelector('[data-cart-drawer]');

      if (!drawerEl) return;

      itemsEl = drawerEl.querySelector('[data-cart-drawer-items]');
      emptyEl = drawerEl.querySelector('[data-cart-drawer-empty]');
      footerEl = drawerEl.querySelector('[data-cart-drawer-footer]');
      subtotalEl = drawerEl.querySelector('[data-cart-drawer-subtotal]');

      drawerEl.querySelector('[data-cart-drawer-overlay]')?.addEventListener('click', close);

      drawerEl.querySelectorAll('[data-cart-drawer-close]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          close();
        });
      });

      document.querySelectorAll('[data-cart-drawer-toggle]').forEach((link) => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          open();
        });
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && drawerEl.classList.contains('is-open')) {
          close();
        }
      });
    };

    return { init, open, close, addToCart, refreshCart };
  })();

  /* ── Quick add-to-cart (AJAX) ──────────────────────── */

  const initQuickATC = () => {
    document.addEventListener('submit', (e) => {
      const form = e.target.closest('[data-quick-atc]');
      if (!form) return;

      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Adding\u2026';

      CartDrawer.addToCart(new FormData(form))
        .catch(() => {
          btn.textContent = 'Error';
          setTimeout(() => {
            btn.textContent = originalText;
          }, 2000);
        })
        .finally(() => {
          btn.disabled = false;
          btn.textContent = originalText;
        });
    });
  };

  /* ── Init ──────────────────────────────────────────── */

  const init = () => {
    initGiftFinder();
    initProductRecommendations();
    initProductDetails();
    CartDrawer.init();
    initQuickATC();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
