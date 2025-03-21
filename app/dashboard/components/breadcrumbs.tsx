'use client';

import React from 'react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { usePathname } from 'next/navigation'; // To get the current route

const Breadcrumbs = () => {
  const pathname = usePathname(); // Get current pathname
  const pathSegments = pathname.split('/').filter(Boolean); // Split pathname into segments and filter out empty strings

  const breadcrumbItems = pathSegments.map((segment, index) => {
    const href = '/' + pathSegments.slice(0, index + 1).join('/'); // Build the href dynamically
    const label = segment.charAt(0).toUpperCase() + segment.slice(1); // Capitalize the first letter of each segment

    return { label, href };
  });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbItems.map((item, index) => {
          const isLastItem = index === breadcrumbItems.length - 1; // Check if it's the last item
          return (
            <React.Fragment key={index}>
              <BreadcrumbItem>
                {/* For the last breadcrumb, use BreadcrumbPage instead of BreadcrumbLink */}
                {isLastItem ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {index < breadcrumbItems.length - 1 && <BreadcrumbSeparator />}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default Breadcrumbs;
