import { cn } from 'cn';
import {
  ArrowDownLeftIcon,
  ArrowLeftRightIcon,
  BanknoteIcon,
  BriefcaseIcon,
  CarIcon,
  CoffeeIcon,
  DumbbellIcon,
  EyeOffIcon,
  GiftIcon,
  HeartPulseIcon,
  HouseIcon,
  LandmarkIcon,
  LucideIcon,
  PercentIcon,
  PlaneIcon,
  ReceiptIcon,
  RepeatIcon,
  ShoppingBagIcon,
  ShoppingBasketIcon,
  SparklesIcon,
  TagIcon,
  TicketIcon,
  TrendingUpIcon,
  UsersIcon,
  UtensilsIcon,
} from 'lucide-react';
import { ComponentProps } from 'react';

import { Category } from '@/lib/types/categories.types';

// The icons of the default categories, see private.seed_default_categories()
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'arrow-down-left': ArrowDownLeftIcon,
  'arrow-left-right': ArrowLeftRightIcon,
  banknote: BanknoteIcon,
  briefcase: BriefcaseIcon,
  car: CarIcon,
  coffee: CoffeeIcon,
  dumbbell: DumbbellIcon,
  'eye-off': EyeOffIcon,
  gift: GiftIcon,
  'heart-pulse': HeartPulseIcon,
  house: HouseIcon,
  landmark: LandmarkIcon,
  percent: PercentIcon,
  plane: PlaneIcon,
  receipt: ReceiptIcon,
  repeat: RepeatIcon,
  'shopping-bag': ShoppingBagIcon,
  'shopping-basket': ShoppingBasketIcon,
  sparkles: SparklesIcon,
  tag: TagIcon,
  ticket: TicketIcon,
  'trending-up': TrendingUpIcon,
  users: UsersIcon,
  utensils: UtensilsIcon,
};

export function CategoryIcon({
  category,
  className,
}: {
  category: Pick<Category, 'icon' | 'color'>;
  className?: string;
}) {
  const Icon = CATEGORY_ICONS[category.icon] ?? TagIcon;
  return <Icon className={cn('size-4 shrink-0', className)} style={{ color: category.color }} />;
}

/** The color of transactions without a category, in charts and drawers */
export const UNCATEGORIZED_COLOR = '#a1a1aa';

/**
 * The category's icon on a tint of its color, or a grey tag without a category.
 */
export function CategoryAvatar({
  category,
  className,
}: {
  category: Pick<Category, 'icon' | 'color'> | null;
  className?: string;
}) {
  const { icon, color } = category ?? { icon: 'tag', color: UNCATEGORIZED_COLOR };
  return (
    <span
      className={cn('flex size-9 shrink-0 items-center justify-center rounded-full', className)}
      style={{ backgroundColor: `color-mix(in srgb, ${color} 18%, transparent)` }}
    >
      <CategoryIcon category={{ icon, color }} />
    </span>
  );
}

interface CategoryBadgeProps extends ComponentProps<'span'> {
  category: Category | null;
  /** Not counted in analytics, which adds an icon, and shows "Excluded" without a category */
  excluded?: boolean;
}

export function CategoryBadge({ category, excluded, className, ...props }: CategoryBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        !category &&
          (excluded
            ? 'text-muted-foreground'
            : 'border-amber-500/40 text-amber-600 dark:text-amber-500'),
        className,
      )}
      {...props}
    >
      {category && <CategoryIcon category={category} className="size-3" />}
      {category?.name ?? (excluded ? 'Excluded' : 'Uncategorized')}
      {excluded && (
        <EyeOffIcon className="size-3 text-muted-foreground" aria-label="Not counted in analytics">
          <title>Not counted in analytics</title>
        </EyeOffIcon>
      )}
    </span>
  );
}
