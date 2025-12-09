import {
  Clock,
  MapPin,
  Utensils,
  Building,
  TreePine,
  Palette,
  Camera,
  Landmark,
  Dumbbell,
  Waves,
  Compass,
  ShoppingBag,
  Music,
  LucideIcon,
} from 'lucide-react';

export type ActivityType = 'arrival' | 'meal' | 'landmark' | 'museum' | 'nature' | 'art' | 'photo' | 'sport' | 'water' | 'shopping' | 'entertainment' | 'general';

export function detectActivityType(activityName: string, description: string): ActivityType {
  const combined = (activityName + ' ' + description).toLowerCase();

  if (
    combined.includes('arrive') ||
    combined.includes('check-in') ||
    combined.includes('checkin') ||
    combined.includes('departure') ||
    combined.includes('airport') ||
    combined.includes('station')
  ) {
    return 'arrival';
  }

  if (
    combined.includes('lunch') ||
    combined.includes('dinner') ||
    combined.includes('breakfast') ||
    combined.includes('brunch') ||
    combined.includes('meal') ||
    combined.includes('restaurant') ||
    combined.includes('café') ||
    combined.includes('cafe') ||
    combined.includes('eat') ||
    combined.includes('food')
  ) {
    return 'meal';
  }

  if (
    combined.includes('museum') ||
    combined.includes('gallery') ||
    combined.includes('exhibition') ||
    combined.includes('art institute') ||
    combined.includes('MoMA') ||
    combined.includes('louvre')
  ) {
    return 'museum';
  }

  if (
    combined.includes('park') ||
    combined.includes('forest') ||
    combined.includes('nature') ||
    combined.includes('garden') ||
    combined.includes('green') ||
    combined.includes('hiking')
  ) {
    return 'nature';
  }

  if (
    combined.includes('swimming') ||
    combined.includes('beach') ||
    combined.includes('water') ||
    combined.includes('surf') ||
    combined.includes('diving') ||
    combined.includes('kayak')
  ) {
    return 'water';
  }

  if (
    combined.includes('photo') ||
    combined.includes('photograph') ||
    combined.includes('picture') ||
    combined.includes('cloud gate') ||
    combined.includes('the bean')
  ) {
    return 'photo';
  }

  if (
    combined.includes('art') ||
    combined.includes('paint') ||
    combined.includes('sculpture') ||
    combined.includes('street art') ||
    combined.includes('mural')
  ) {
    return 'art';
  }

  if (
    combined.includes('gym') ||
    combined.includes('yoga') ||
    combined.includes('exercise') ||
    combined.includes('fitness') ||
    combined.includes('sport')
  ) {
    return 'sport';
  }

  if (
    combined.includes('shop') ||
    combined.includes('shopping') ||
    combined.includes('market') ||
    combined.includes('mall')
  ) {
    return 'shopping';
  }

  if (
    combined.includes('concert') ||
    combined.includes('show') ||
    combined.includes('theater') ||
    combined.includes('theatre') ||
    combined.includes('performance') ||
    combined.includes('music')
  ) {
    return 'entertainment';
  }

  return 'general';
}

export function getActivityIcon(type: ActivityType): LucideIcon {
  const icons: Record<ActivityType, LucideIcon> = {
    arrival: Clock,
    meal: Utensils,
    landmark: Landmark,
    museum: Building,
    nature: TreePine,
    art: Palette,
    photo: Camera,
    sport: Dumbbell,
    water: Waves,
    shopping: ShoppingBag,
    entertainment: Music,
    general: MapPin,
  };

  return icons[type] || MapPin;
}

export function getActivityColor(type: ActivityType): string {
  const colors: Record<ActivityType, string> = {
    arrival: 'bg-sky-100 text-sky-600',
    meal: 'bg-orange-100 text-orange-600',
    landmark: 'bg-amber-100 text-amber-600',
    museum: 'bg-purple-100 text-purple-600',
    nature: 'bg-green-100 text-green-600',
    art: 'bg-pink-100 text-pink-600',
    photo: 'bg-blue-100 text-blue-600',
    sport: 'bg-red-100 text-red-600',
    water: 'bg-cyan-100 text-cyan-600',
    shopping: 'bg-fuchsia-100 text-fuchsia-600',
    entertainment: 'bg-indigo-100 text-indigo-600',
    general: 'bg-slate-100 text-slate-600',
  };

  return colors[type];
}

export function isPlaceName(activityName: string): boolean {
  const placePrefixes = [
    'the ',
    'visit ',
    'explore ',
    'tour ',
    'see ',
    'walk through',
    'stroll',
  ];

  const placeIndicators = [
    'park',
    'museum',
    'gallery',
    'landmark',
    'monument',
    'castle',
    'church',
    'temple',
    'palace',
    'cathedral',
    'institute',
    'center',
    'centre',
    'beach',
    'lake',
    'river',
    'mountain',
    'garden',
    'square',
    'plaza',
    'street',
    'avenue',
    'bridge',
    'pier',
    'fountain',
    'statue',
  ];

  const lowerName = activityName.toLowerCase();

  return (
    placePrefixes.some((prefix) => lowerName.startsWith(prefix)) ||
    placeIndicators.some((indicator) => lowerName.includes(indicator))
  );
}
