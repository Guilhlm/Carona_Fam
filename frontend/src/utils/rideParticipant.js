export function isRideCaronaPassenger(ride, userId) {
  if (!ride || !userId) return false;
  return (ride.passengers || []).some(
    (passengerLink) => passengerLink.passengerId === userId && passengerLink.status !== 'CANCELLED'
  );
}

export function isRideRequester(ride, userId) {
  return Boolean(ride && userId && ride.requesterId === userId);
}

export function inferParticipationRole(ride, user) {
  if (!ride || !user?.id) return null;
  if (ride.driverId === user.id) return 'DRIVER';
  if (ride.requesterId === user.id) return 'REQUESTER';
  return 'CARONA';
}

export function getRideParticipantRole(ride, user) {
  if (!ride || !user?.id) return null;
  if (ride.participationRole === 'DRIVER' || ride.driverId === user.id) return 'DRIVER';
  if (ride.participationRole === 'REQUESTER' || isRideRequester(ride, user.id)) return 'PASSENGER';
  if (ride.participationRole === 'CARONA' || isRideCaronaPassenger(ride, user.id)) return 'CARONA';
  if (ride.requesterId !== user.id && ride.driverId !== user.id) return 'CARONA';
  return null;
}

export function isCaronaViewer(ride, user) {
  return getRideParticipantRole(ride, user) === 'CARONA';
}
