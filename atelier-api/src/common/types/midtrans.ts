export type AtelierSnapTransaction = {
  transaction_details: {
    order_id: string;
    gross_amount: number;
  };

  item_details: Array<{
    id: string;
    price: number;
    quantity: number;
    name: string;
  }>;
};
