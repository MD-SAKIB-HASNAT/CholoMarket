'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LoadingBlock, PageHeader } from '@/components/dashboard/DashboardShell';
import { EmptyState, StatusBadge } from '@/components/shared/Bits';
import { api } from '@/utils/api/api';
import type { Product } from '@/utils/types';
import { ProductForm } from '@/app/(protected)/portal/shop/[shopId]/components/ProductForm';
import { shopBase, useShopId } from '@/app/(protected)/portal/shop/[shopId]/hooks/useshop';
import { ManagerOnly } from '@/app/(protected)/portal/shop/[shopId]/components/ManagerOnly';
import { PORTAL_ENDPOINTS } from '@/utils/endpoints/portal.endpoints';

function EditProductPage() {
  const shopId = useShopId();
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['shop', shopId, 'product', id],
    queryFn: () => api<Product>(PORTAL_ENDPOINTS.shop.product(shopId, id)),
  });
  const back = (
    <Button
      variant="ghost"
      size="sm"
      className="mb-2"
      render={<Link href={`${shopBase(shopId)}/products`} />}
    >
      <ArrowLeft /> Products
    </Button>
  );

  if (isLoading) return <LoadingBlock rows={6} />;
  if (isError || !data)
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Product not found"
        description={error?.message}
        action={back}
      />
    );

  return (
    <div>
      {back}
      <PageHeader
        title={data.nameEn}
        description="Price changes are recorded in the audit log."
        actions={
          <>
            <StatusBadge status={data.status} />
          </>
        }
      />
      {/* key resets the form when navigating between products */}
      <ProductForm key={data.id} shopId={shopId} product={data} />
    </div>
  );
}

export default function EditProductPagePage() {
  return (
    <ManagerOnly>
      <EditProductPage />
    </ManagerOnly>
  );
}
