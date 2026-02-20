(() => {
  const root = document.documentElement;
  root.classList.remove('no-js');

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

          container.innerHTML = recommendations.innerHTML;
        })
        .catch(() => {
          container.setAttribute('hidden', 'hidden');
        });
    });
  };

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

  const init = () => {
    initGiftFinder();
    initProductRecommendations();
    initProductDetails();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
