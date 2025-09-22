
export interface Spec {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  imageUrl: string;
  specs: { [key: string]: string }; // key is spec.id
}
