class ReviewRepository {
  constructor(prismaClient) {
    this.prisma = prismaClient;
  }

  findByRideAndReviewer(rideId, reviewerId) {
    return this.prisma.review.findFirst({
      where: { rideId, reviewerId },
    });
  }

  findManyByRide(rideId) {
    return this.prisma.review.findMany({
      where: { rideId },
      include: {
        reviewer: { select: { id: true, name: true, photoUrl: true } },
        reviewed: { select: { id: true, name: true, photoUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  create({ rideId, reviewerId, reviewedId, rating, comment }) {
    return this.prisma.review.create({
      data: { rideId, reviewerId, reviewedId, rating, comment },
      include: {
        reviewer: { select: { id: true, name: true } },
        reviewed: { select: { id: true, name: true } },
      },
    });
  }
}

module.exports = ReviewRepository;
