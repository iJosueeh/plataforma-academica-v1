import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '@app/core/auth/services/auth';
import { CourseDetalles } from '@app/core/models/course-detalles';
import { CarritoService } from '../estudiante/services/carrito.service';
import { CursoService } from '../cursos/services/curso.service';
import { forkJoin, Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
    selector: 'app-checkout',
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './checkout.html',
    styleUrl: './checkout.css',
})
export class Checkout implements OnInit {
    private authService = inject(Auth);
    private carritoService = inject(CarritoService);
    private cursoService = inject(CursoService);
    private fb = inject(FormBuilder);
    private router = inject(Router);

    cartItems: CourseDetalles[] = [];
    totalPrice = 0;
    loading = true;
    processing = false;
    selectedPaymentMethod: 'card' | 'paypal' | 'bank' = 'card';

    paymentForm!: FormGroup;

    ngOnInit(): void {
        this.initializeForm();
        this.loadCartDetails();
    }

    initializeForm(): void {
        this.paymentForm = this.fb.group({
            cardNumber: ['', [Validators.required, Validators.pattern(/^\d{16}$/)]],
            cardHolder: ['', [Validators.required, Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)]],
            expiryDate: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)]],
            cvv: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]],
            country: ['', Validators.required],
            postalCode: ['']
        });
    }

    loadCartDetails(): void {
        const currentUser = this.authService.getCurrentUser();
        if (!currentUser) {
            this.router.navigate(['/login']);
            return;
        }

        this.carritoService.verCarrito(currentUser.id).pipe(
            switchMap(carrito => {
                if (carrito.cursoIds && carrito.cursoIds.length > 0) {
                    const courseObservables: Observable<CourseDetalles>[] = carrito.cursoIds.map(id =>
                        this.cursoService.getCourseById(id)
                    );
                    return forkJoin(courseObservables);
                }
                return new Observable<CourseDetalles[]>(subscriber => subscriber.next([]));
            })
        ).subscribe(courses => {
            this.cartItems = courses;
            this.calculateTotal();
            this.loading = false;

            // Si el carrito está vacío, redirigir
            if (this.cartItems.length === 0) {
                this.router.navigate(['/carrito']);
            }
        });
    }

    calculateTotal(): void {
        this.totalPrice = this.cartItems.reduce((acc, item) => acc + item.precio, 0);
    }

    selectPaymentMethod(method: 'card' | 'paypal' | 'bank'): void {
        this.selectedPaymentMethod = method;
    }

    formatCardNumber(event: any): void {
        let value = event.target.value.replace(/\s/g, '');
        let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
        this.paymentForm.patchValue({ cardNumber: formattedValue.replace(/\s/g, '') });
        event.target.value = formattedValue;
    }

    formatExpiryDate(event: any): void {
        let value = event.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        event.target.value = value;
        this.paymentForm.patchValue({ expiryDate: value });
    }

    processPayment(): void {
        if (this.paymentForm.invalid && this.selectedPaymentMethod === 'card') {
            Object.keys(this.paymentForm.controls).forEach(key => {
                this.paymentForm.get(key)?.markAsTouched();
            });
            return;
        }

        this.processing = true;

        // Simulación de procesamiento de pago (2 segundos)
        setTimeout(() => {
            this.processing = false;

            // Aquí es donde llamarías al backend para procesar el pago
            // Por ahora, simulamos éxito y navegamos a confirmación

            // Guardar datos de la orden en sessionStorage para la página de confirmación
            const orderData = {
                items: this.cartItems,
                total: this.totalPrice,
                paymentMethod: this.selectedPaymentMethod,
                orderDate: new Date().toISOString(),
                orderId: this.generateOrderId()
            };

            sessionStorage.setItem('lastOrder', JSON.stringify(orderData));

            // Navegar a página de confirmación
            this.router.navigate(['/checkout/confirmacion']);
        }, 2000);
    }

    private generateOrderId(): string {
        return 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    }

    getFieldError(fieldName: string): string {
        const field = this.paymentForm.get(fieldName);
        if (field?.hasError('required')) {
            return 'Este campo es requerido';
        }
        if (field?.hasError('pattern')) {
            switch (fieldName) {
                case 'cardNumber':
                    return 'Número de tarjeta inválido (16 dígitos)';
                case 'cardHolder':
                    return 'Solo se permiten letras';
                case 'expiryDate':
                    return 'Formato: MM/YY';
                case 'cvv':
                    return 'CVV inválido (3-4 dígitos)';
                default:
                    return 'Formato inválido';
            }
        }
        return '';
    }

    isFieldInvalid(fieldName: string): boolean {
        const field = this.paymentForm.get(fieldName);
        return !!(field?.invalid && field?.touched);
    }

    isFieldValid(fieldName: string): boolean {
        const field = this.paymentForm.get(fieldName);
        return !!(field?.valid && field?.touched);
    }
}
