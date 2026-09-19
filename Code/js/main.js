import { getSidebar } from './components/sidebar.js';
import { getHeader } from './components/header.js';

document.addEventListener('DOMContentLoaded', () => {
  // Render Sidebar
  const sidebarContainer = document.getElementById('sidebar-container');
  if (sidebarContainer) {
    sidebarContainer.innerHTML = getSidebar();
  }

  // Render Header
  const headerContainer = document.getElementById('header-container');
  if (headerContainer) {
    headerContainer.innerHTML = getHeader();
  }

  // Highlight active menu item based on current URL
  const currentPath = window.location.pathname.split('/').pop() || 'dashboard.html';
  const navLinks = document.querySelectorAll('#sidebar-container nav a');
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath) {
      link.classList.remove('text-on-surface-variant', 'hover:bg-surface-container-low', 'hover:text-primary');
      link.classList.add('bg-[#FEE2E2]', 'text-primary', 'font-body-md-medium');
      const icon = link.querySelector('.material-symbols-outlined');
      if (icon) {
        icon.classList.remove('text-[#64748B]', 'group-hover:text-primary');
        icon.classList.add('text-primary');
        icon.style.fontVariationSettings = "'FILL' 1";
      }
    } else {
      link.classList.add('text-on-surface-variant', 'hover:bg-surface-container-low', 'hover:text-primary');
      link.classList.remove('bg-[#FEE2E2]', 'text-primary', 'font-body-md-medium');
      const icon = link.querySelector('.material-symbols-outlined');
      if (icon) {
        icon.classList.add('text-[#64748B]', 'group-hover:text-primary');
        icon.classList.remove('text-primary');
        icon.style.fontVariationSettings = "";
      }
    }
  });
});
