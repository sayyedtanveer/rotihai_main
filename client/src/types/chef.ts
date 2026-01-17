interface Chef {
  id: string;
  name: string;
  description: string;
  image: string;
  rating: string;
  reviewCount: number;
  categoryId: string;
  distanceFromUser?: number; // Distance in km from user (from /api/chefs/by-location)
}
