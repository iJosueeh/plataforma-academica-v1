import { Module } from "./module";
import { TestimonialDetailCourse } from "./testimonial";

export interface CourseDetalles {
    id: string;
    titulo: string;
    descripcion: string;
    categoria: string;
    duracion: string;
    modalidad: string;
    certificacion: string;
    nivel: string;
    precio: number;
    precioOriginal?: number;
    imagen: string;
    instructor: {
        nombre: string;
        cargo: string;
        bio: string;
        avatar: string;
        linkedIn?: string;
    };
    modulos: Module[];
    requisitos: string[];
    testimonios: TestimonialDetailCourse[];
}