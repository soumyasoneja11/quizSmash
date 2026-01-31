/**
 * Celebration and Particle Animation System for QuizSmash
 * Creates visual effects for correct answers, victories, and celebrations
 */

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  emoji?: string;
  color?: string;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private animationFrameId: number | null = null;
  private container: HTMLElement | null = null;

  /**
   * Initialize particle system with a container
   */
  init(containerId: string): void {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.warn(`Container ${containerId} not found`);
      return;
    }
  }

  /**
   * Create confetti particles
   */
  createConfetti(x: number, y: number, count: number = 30): void {
    const colors = ['#FF6B6B', '#FFE66D', '#95E1D3', '#A8E6CF', '#C7CEEA'];
    const emojis = ['🎉', '⭐', '🎊', '✨', '🎈'];

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const velocity = 3 + Math.random() * 4;
      const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

      this.particles.push({
        id: `confetti-${Date.now()}-${i}`,
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - 5, // Initial upward velocity
        life: 1,
        maxLife: 2,
        size: 20 + Math.random() * 10,
        emoji: randomEmoji,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    this.startAnimation();
  }

  /**
   * Create sparkle particles for speed bonus
   */
  createSparkles(x: number, y: number, count: number = 20): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = 2 + Math.random() * 3;

      this.particles.push({
        id: `sparkle-${Date.now()}-${i}`,
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life: 1,
        maxLife: 1.5,
        size: 4 + Math.random() * 6,
        color: '#FFD700',
      });
    }

    this.startAnimation();
  }

  /**
   * Create floating text (points display)
   */
  createFloatingText(x: number, y: number, text: string, color: string = '#00FF00'): void {
    this.particles.push({
      id: `text-${Date.now()}`,
      x,
      y,
      vx: 0,
      vy: -2,
      life: 1,
      maxLife: 1.5,
      size: 24,
      color,
      emoji: text,
    });

    this.startAnimation();
  }

  /**
   * Create burst effect (explosion from a point)
   */
  createBurst(x: number, y: number, count: number = 40): void {
    const colors = ['#FF6B6B', '#FFE66D', '#95E1D3', '#A8E6CF'];

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const velocity = 4 + Math.random() * 5;

      this.particles.push({
        id: `burst-${Date.now()}-${i}`,
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life: 1,
        maxLife: 1.2,
        size: 6 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    this.startAnimation();
  }

  /**
   * Start animation loop
   */
  private startAnimation(): void {
    if (this.animationFrameId !== null) return;

    const animate = () => {
      this.update();
      this.render();

      if (this.particles.length > 0) {
        this.animationFrameId = requestAnimationFrame(animate);
      } else {
        this.animationFrameId = null;
      }
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  /**
   * Update particle positions and lifetimes
   */
  private update(): void {
    this.particles = this.particles.filter((p) => {
      p.life -= 1 / 60; // Assuming 60fps
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15; // Gravity
      return p.life > 0;
    });
  }

  /**
   * Render particles to the container
   */
  private render(): void {
    if (!this.container) return;

    // Clear previous particles
    const existingParticles = this.container.querySelectorAll('.particle');
    existingParticles.forEach((p) => p.remove());

    this.particles.forEach((p) => {
      const el = document.createElement('div');
      el.className = 'particle';
      el.style.cssText = `
        position: fixed;
        left: ${p.x}px;
        top: ${p.y}px;
        font-size: ${p.size}px;
        opacity: ${p.life / p.maxLife};
        pointer-events: none;
        transform: translate(-50%, -50%);
        z-index: 9999;
      `;

      if (p.emoji) {
        el.textContent = p.emoji;
      } else {
        el.style.width = `${p.size}px`;
        el.style.height = `${p.size}px`;
        el.style.backgroundColor = p.color || '#FFD700';
        el.style.borderRadius = '50%';
      }

      this.container!.appendChild(el);
    });
  }

  /**
   * Clear all particles
   */
  clear(): void {
    this.particles = [];
    if (this.container) {
      const existingParticles = this.container.querySelectorAll('.particle');
      existingParticles.forEach((p) => p.remove());
    }
  }

  /**
   * Get particle count for debugging
   */
  getParticleCount(): number {
    return this.particles.length;
  }
}

/**
 * CSS-based celebration animations
 */
export const celebrationCSS = `
  @keyframes celebrate-bounce {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.2); }
  }

  @keyframes celebrate-rotate {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @keyframes celebrate-rainbow {
    0% { color: red; }
    16% { color: orange; }
    33% { color: yellow; }
    50% { color: green; }
    66% { color: blue; }
    83% { color: indigo; }
    100% { color: violet; }
  }

  .celebration-active {
    animation: celebrate-bounce 0.6s ease-in-out;
  }

  .celebration-spinning {
    animation: celebrate-rotate 1s linear infinite;
  }

  .celebration-rainbow {
    animation: celebrate-rainbow 2s linear infinite;
  }
`;

export const particleSystem = new ParticleSystem();
