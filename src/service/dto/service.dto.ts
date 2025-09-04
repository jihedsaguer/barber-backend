export class CreateServiceDto {
    name!: string;
    duration!: number;
    price!: number;
  }
  
  export class UpdateServiceDto {
    name?: string;
    duration?: number;
    price?: number;
    isActive?: boolean;
  }
  