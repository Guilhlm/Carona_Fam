class ReviewRepository {
  constructor(prismaClient) {
    this.prisma = prismaClient;
  }

  async listReviews(filters = {}) {
    const { page = 1, limit = 20, isDisabled, search, order } = filters;
    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 20;
    const skip = (pageNumber - 1) * limitNumber;

    const where = {};

    if (isDisabled === 'true' || isDisabled === true) {
      where.isDisabled = true;
    } else if (isDisabled === 'false' || isDisabled === false) {
      where.isDisabled = false;
    }

    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { comment: { contains: term, mode: 'insensitive' } },
        { reviewer: { name: { contains: term, mode: 'insensitive' } } },
        { reviewer: { email: { contains: term, mode: 'insensitive' } } },
        { reviewed: { name: { contains: term, mode: 'insensitive' } } },
        { reviewed: { email: { contains: term, mode: 'insensitive' } } },
      ];
    }

    let orderBy = [{ createdAt: 'desc' }];
    if (order === 'rating_desc') orderBy = [{ rating: 'desc' }, { createdAt: 'desc' }];
    else if (order === 'driver_asc') orderBy = [{ reviewed: { name: 'asc' } }];
    else if (order === 'driver_desc') orderBy = [{ reviewed: { name: 'desc' } }];

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          reviewer: { select: { id: true, name: true, email: true, ra: true } },
          reviewed: { select: { id: true, name: true, email: true, ra: true } },
          ride: {
            select: {
              id: true,
              origin: true,
              destination: true,
              departureAt: true,
              arrivalAt: true,
              status: true,
              driver: { select: { id: true, name: true, email: true } },
              vehicle: { select: { brand: true, model: true, plate: true } },
              passengers: {
                include: { passenger: { select: { id: true, name: true, email: true } } },
              },
            },
          },
        },
        skip,
        take: limitNumber,
        orderBy,
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      data: reviews.map((review) => ({
        id: review.id,
        rideId: review.rideId,
        rating: review.rating,
        comment: review.comment ?? null,
        isDisabled: !!review.isDisabled,
        disabledReason: review.disabledReason ?? null,
        createdAt: review.createdAt,
        reviewerId: review.reviewer?.id,
        reviewerName: review.reviewer?.name,
        reviewerEmail: review.reviewer?.email,
        reviewerRa: review.reviewer?.ra ?? null,
        reviewedId: review.reviewed?.id,
        reviewedName: review.reviewed?.name,
        reviewedEmail: review.reviewed?.email,
        reviewedRa: review.reviewed?.ra ?? null,
        ride: review.ride
          ? {
              id: review.ride.id,
              origin: review.ride.origin,
              destination: review.ride.destination,
              departureAt: review.ride.departureAt,
              arrivalAt: review.ride.arrivalAt,
              status: review.ride.status,
              driverName: review.ride.driver?.name,
              driverEmail: review.ride.driver?.email,
              vehicle: review.ride.vehicle
                ? `${review.ride.vehicle.brand ?? ''} ${review.ride.vehicle.model ?? ''} (${review.ride.vehicle.plate ?? ''})`.trim()
                : null,
              passengers: (review.ride.passengers ?? []).map((passenger) => ({
                id: passenger.passenger?.id,
                name: passenger.passenger?.name,
                email: passenger.passenger?.email,
              })),
            }
          : null,
      })),
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
  }

  findById(reviewId) {
    return this.prisma.review.findUnique({
      where: { id: reviewId },
    });
  }

  updateDisableStatus(reviewId, data) {
    return this.prisma.review.update({
      where: { id: reviewId },
      data,
      include: {
        reviewer: { select: { id: true, name: true, email: true } },
        reviewed: { select: { id: true, name: true, email: true } },
      },
    });
  }
}

module.exports = ReviewRepository;
