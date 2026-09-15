export class Address {
  id!: number;
  userId!: number;
  label!: string;
  recipientName!: string;
  phone!: string;
  addressLine!: string;
  city!: string;
  province!: string;
  postalCode!: string;
  isDefault!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}
