export type SnapTransactionPayload = {
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

  customer_details: {
    first_name: string;
    email: string;
    phone: string;

    shipping_address: {
      first_name: string;
      phone: string;
      address: string;
      city: string;
      postal_code: string;
      country_code: string;
    };
  };

  callbacks: {
    finish: string;
    unfinish: string;
    error: string;
    pending: string;
  };
};

export type SnapTransactionResponse = {
  token?: string;
  redirect_url?: string;
};
