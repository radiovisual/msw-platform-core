export const animations = `
@keyframes slideDown {
  from { 
    transform: translateY(-100%); 
    opacity: 0; 
  }
  to { 
    transform: translateY(0); 
    opacity: 1; 
  }
}

@keyframes slideUp {
  from { 
    transform: translateY(20px); 
    opacity: 0; 
  }
  to { 
    transform: translateY(0); 
    opacity: 1; 
  }
}

@keyframes slideDown {
  from { 
    transform: translateY(-20px); 
    opacity: 0; 
  }
  to { 
    transform: translateY(0); 
    opacity: 1; 
  }
}

@keyframes fadeIn {
  from { 
    opacity: 0; 
  }
  to { 
    opacity: 1; 
  }
}

@keyframes fadeOut {
  from { 
    opacity: 1; 
  }
  to { 
    opacity: 0; 
  }
}

@keyframes pulse {
  0%, 100% { 
    transform: scale(1); 
  }
  50% { 
    transform: scale(1.05); 
  }
}

@keyframes bounce {
  0%, 100% { 
    transform: translateY(0); 
  }
  50% { 
    transform: translateY(-4px); 
  }
}
`;

export const injectAnimations = () => {
	// Check if animations are already injected
	if (document.querySelector('#mockui-animations')) {
		return;
	}

	const style = document.createElement('style');
	style.id = 'mockui-animations';
	style.textContent = animations;
	document.head.appendChild(style);
};