
export interface Spec {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  brand: string;
  model: string;
  imageUrl: string;
  specs: { [key: string]: string }; // key is spec.id
}
