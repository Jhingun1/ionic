import { writeTask } from '@stencil/core';

import { GestureDetail } from '../../../utils/gesture';

import { ModalGesture } from './index';

// Defaults for the card swipe animation
export const SwipeToCloseDefaults = {
  MIN_BACKDROP_OPACITY: 0.4,
  MIN_PRESENTING_SCALE: 0.92,
  MIN_Y: 44,
  MIN_PRESENTING_Y: -12
};

export class SwipeToCloseGesture implements ModalGesture {
  // The current opacity of the backdrop element
  private minBackdropOpacity = SwipeToCloseDefaults.MIN_BACKDROP_OPACITY;
  private backdropOpacity = 0;
  // The current scale of the presenting element
  private minPresentingScale = SwipeToCloseDefaults.MIN_PRESENTING_SCALE;
  private presentingScale = 0;
  // The minimum y position of the presenting element
  private minPresentingY = SwipeToCloseDefaults.MIN_PRESENTING_Y;
  // The minimum y position for the open card style modal
  private minY = SwipeToCloseDefaults.MIN_Y;
  // Current Y position of the dragging modal
  private y = 0;

  constructor(
    private el: HTMLIonModalElement,
    private backdropEl: HTMLElement | undefined,
    private wrapperEl: HTMLElement | undefined,
    private presentingEl: HTMLElement | undefined,
    private onDismiss: (velocityY: number) => void) {
    this.init();
  }

  async init() {
    const gesture = (await import('../../../utils/gesture')).createGesture({
      el: this.el,
      gestureName: 'modalSwipeToClose',
      gesturePriority: 110,
      threshold: 0,
      direction: 'y',
      passive: true,
      canStart: detail => this.canStart(detail),
      onStart: detail => this.onStart(detail),
      onMove: detail => this.onMove(detail),
      onEnd: detail => this.onEnd(detail)
    });

    gesture.setDisabled(false);
  }

  getY() {
    return this.y;
  }

  getBackdropOpacity() {
    return this.backdropOpacity;
  }

  getPresentingScale() {
    return this.presentingScale;
  }

  private canStart(_detail: GestureDetail) {
    return true;
  }

  private onStart(_detail: GestureDetail) {
    this.disableTransition();
    this.backdropOpacity = parseFloat(this.backdropEl!.style.opacity!);
  }

  private onMove(detail: GestureDetail) {
    const y = this.minY + detail.deltaY;

    this.slideTo(y);
  }

  private onEnd(detail: GestureDetail) {
    console.log('On end', detail);

    const viewportHeight = window.innerHeight;

    this.enableTransition();

    if (detail.velocityY < -0.6) {
      this.swipeOpen();
    } else if (detail.velocityY > 0.6) {
      this.onDismiss(detail.velocityY);
    } else if (detail.currentY <= viewportHeight / 2) {
      this.swipeOpen();
    } else {
      this.onDismiss(detail.velocityY);
    }
  }

  private disableTransition() {
    this.wrapperEl!.style.transition = '';
  }

  private enableTransition() {
    this.wrapperEl!.style.transition = `400ms transform cubic-bezier(0.23, 1, 0.32, 1)`;
  }

  private slideTo(y: number) {
    const viewportHeight = (this.el.ownerDocument as any).defaultView.innerHeight;

    const dy = y - this.minY;

    const yRatio = dy / viewportHeight;

    console.log(y, yRatio);

    const backdropOpacity = this.minBackdropOpacity - this.minBackdropOpacity * yRatio;
    const presentingScale = this.minPresentingScale - (this.minPresentingScale * -yRatio) * 0.05;

    // Store current state of values for animation effects
    this.presentingScale = presentingScale;
    this.backdropOpacity = backdropOpacity;
    this.y = y;

    this.setPresentingScale(presentingScale);
    this.setBackdropOpacity(backdropOpacity);
    // this.y = y;
    writeTask(() => {
      this.wrapperEl!.style.transform = `translateY(${y}px)`;
    });
  }

  private setBackdropOpacity(opacity: number) {
    writeTask(() => {
      this.backdropEl!.style.opacity = `${opacity}`;
    });
  }

  private setPresentingScale(scale: number) {
    console.log('Presenting scale', scale);
    if (!this.presentingEl) {
      return;
    }

    writeTask(() => {
      this.presentingEl!.style.transform = `translateY(${this.minPresentingY}px) scale(${scale})`;
    });
  }

  private async swipeOpen() {
    requestAnimationFrame(() => {
      this.slideTo(this.minY);
    });
  }
}
