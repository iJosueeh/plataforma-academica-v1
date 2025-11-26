export interface Module {
    id: string;
    titulo: string;
    descripcion: string;
    isExpanded: boolean;
    lecciones?: string[];
}