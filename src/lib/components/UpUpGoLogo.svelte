<!-- UpUpGoLogo.svelte -->
<script>
// @ts-nocheck

    export let size = 'md'; // 'sm', 'md', 'lg', 'xl'
    export let animated = true;
    export let variant = 'default'; // 'default', 'white', 'dark'
    
    // Size configurations
    $: sizeConfig = {
      sm: {
        ballSize: 'w-6 h-6',
        fontSize: 'text-xs',
        gap: 'gap-1'
      },
      md: {
        ballSize: 'w-10 h-10',
        fontSize: 'text-sm',
        gap: 'gap-2'
      },
      lg: {
        ballSize: 'w-12 h-12',
        fontSize: 'text-base',
        gap: 'gap-3'
      },
      xl: {
        ballSize: 'w-16 h-16',
        fontSize: 'text-xl',
        gap: 'gap-4'
      }
    };
    
    // Color variants
    $: colorConfig = {
      default: {
        ballU1: 'from-red-500 to-red-600',
        ballP1: 'from-orange-500 to-orange-600', 
        ballU2: 'from-green-500 to-green-600',
        ballP2: 'from-blue-500 to-blue-600',
        ballGo: 'from-purple-500 to-purple-600',
        textColor: 'text-white'
      },
      white: {
        ballU1: 'from-white to-gray-100 border-2 border-red-300',
        ballP1: 'from-white to-gray-100 border-2 border-orange-300',
        ballU2: 'from-white to-gray-100 border-2 border-green-300', 
        ballP2: 'from-white to-gray-100 border-2 border-blue-300',
        ballGo: 'from-white to-gray-100 border-2 border-purple-300',
        textColor: 'text-gray-700'
      },
      dark: {
        ballU1: 'from-gray-800 to-gray-900',
        ballP1: 'from-gray-800 to-gray-900',
        ballU2: 'from-gray-800 to-gray-900',
        ballP2: 'from-gray-800 to-gray-900', 
        ballGo: 'from-gray-800 to-gray-900',
        textColor: 'text-white'
      }
    };
    
    $: config = sizeConfig[size];
    $: colors = colorConfig[variant];
  </script>
  
  <div class="upupgo-logo flex items-center justify-center {config.gap}">
    <div class="bingo-balls flex {config.gap}">
      <!-- U Ball -->
      <div class="bingo-ball {config.ballSize} rounded-full flex items-center justify-center {colors.textColor} font-black {config.fontSize} bg-gradient-to-br {colors.ballU1} shadow-lg transition-all duration-200 hover:scale-110 {animated ? 'animate-bounce' : ''}" 
           style="animation-delay: 0s;">
        U
      </div>
      
      <!-- P Ball -->
      <div class="bingo-ball {config.ballSize} rounded-full flex items-center justify-center {colors.textColor} font-black {config.fontSize} bg-gradient-to-br {colors.ballP1} shadow-lg transition-all duration-200 hover:scale-110 {animated ? 'animate-bounce' : ''}"
           style="animation-delay: 0.2s;">
        P
      </div>
      
      <!-- U Ball -->
      <div class="bingo-ball {config.ballSize} rounded-full flex items-center justify-center {colors.textColor} font-black {config.fontSize} bg-gradient-to-br {colors.ballU2} shadow-lg transition-all duration-200 hover:scale-110 {animated ? 'animate-bounce' : ''}"
           style="animation-delay: 0.4s;">
        U
      </div>
      
      <!-- P Ball -->
      <div class="bingo-ball {config.ballSize} rounded-full flex items-center justify-center {colors.textColor} font-black {config.fontSize} bg-gradient-to-br {colors.ballP2} shadow-lg transition-all duration-200 hover:scale-110 {animated ? 'animate-bounce' : ''}"
           style="animation-delay: 0.6s;">
        P
      </div>
      
      <!-- GO Ball (slightly larger) -->
      <div class="bingo-ball {config.ballSize} rounded-full flex items-center justify-center {colors.textColor} font-black {config.fontSize} bg-gradient-to-br {colors.ballGo} shadow-lg transition-all duration-200 hover:scale-110 {animated ? 'animate-bounce' : ''}"
           style="animation-delay: 0.8s;">
        GO
      </div>
    </div>
  </div>
  
  <style>
    .upupgo-logo .bingo-ball {
      position: relative;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.3);
    }
    
    .upupgo-logo .bingo-ball::before {
      content: '';
      position: absolute;
      top: 15%;
      left: 25%;
      width: 30%;
      height: 30%;
      background: rgba(255, 255, 255, 0.4);
      border-radius: 50%;
      filter: blur(2px);
    }
    
    @keyframes bounce {
      0%, 20%, 50%, 80%, 100% {
        transform: translateY(0);
      }
      40% {
        transform: translateY(-8px);
      }
      60% {
        transform: translateY(-4px);
      }
    }
    
    .animate-bounce {
      animation: bounce 2s ease-in-out infinite;
    }
    
    /* Responsive adjustments */
    @media (max-width: 640px) {
      .upupgo-logo {
        transform: scale(0.8);
      }
    }
  </style>