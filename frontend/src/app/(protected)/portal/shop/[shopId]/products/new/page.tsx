'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/dashboard/DashboardShell';
import { ProductForm } from '@/app/(protected)/portal/shop/[shopId]/components/ProductForm';
import { shopBase, useShopId } from '@/app/(protected)/portal/shop/[shopId]/hooks/useshop';
import { ManagerOnly } from '@/app/(protected)/portal/shop/[shopId]/components/ManagerOnly';

function NewProductPage() {
  const shopId = useShopId();
  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        className="mb-2"
        render={<Link href={`${shopBase(shopId)}/products`} />}
      >
        <ArrowLeft /> Products
      </Button>
      <PageHeader
        title="Add a product"
        description="Add each size or colour as a variant with its own price and stock."
      />
      <ProductForm shopId={shopId} />
    </div>
  );
}

export default function NewProductPagePage() {
  return (
    <ManagerOnly>
      <NewProductPage />
    </ManagerOnly>
  );
}
