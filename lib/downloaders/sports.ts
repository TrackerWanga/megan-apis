const BASE = "https://www.thesportsdb.com/api/v1/json/3";

async function fetchAPI(path: string): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(`${BASE}${path}`, { signal: controller.signal });
    if (!res.ok) throw new Error(`TheSportsDB returned ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function searchTeam(query: string): Promise<any> {
  const data = await fetchAPI(`/searchteams.php?t=${encodeURIComponent(query)}`);
  if (!data.teams) throw new Error(`No team found for "${query}"`);
  const t = data.teams[0];
  return {
    id: t.idTeam, name: t.strTeam, sport: t.strSport, league: t.strLeague,
    country: t.strCountry, stadium: t.strStadium, description: t.strDescriptionEN?.substring(0, 500),
    badge: t.strBadge, jersey: t.strJersey, banner: t.strBanner, website: t.strWebsite,
    facebook: t.strFacebook, twitter: t.strTwitter, instagram: t.strInstagram,
    formedYear: t.intFormedYear,
  };
}

export async function searchPlayer(query: string): Promise<any> {
  const data = await fetchAPI(`/searchplayers.php?p=${encodeURIComponent(query)}`);
  if (!data.player) throw new Error(`No player found for "${query}"`);
  const p = data.player[0];
  return {
    id: p.idPlayer, name: p.strPlayer, sport: p.strSport, team: p.strTeam,
    nationality: p.strNationality, position: p.strPosition, dateBorn: p.dateBorn,
    description: p.strDescriptionEN?.substring(0, 500),
    thumbnail: p.strThumb, cutout: p.strCutout, signing: p.strSigning,
    birthLocation: p.strBirthLocation, height: p.strHeight, weight: p.strWeight,
  };
}

export async function getLeagueTable(leagueId: string, season: string): Promise<any> {
  const data = await fetchAPI(`/lookuptable.php?l=${encodeURIComponent(leagueId)}&s=${encodeURIComponent(season)}`);
  if (!data.table) throw new Error(`No standings found for league ${leagueId} season ${season}`);
  return {
    leagueId, season,
    standings: data.table.map((t: any) => ({
      rank: t.intRank, team: t.strTeam, teamId: t.idTeam, played: t.intPlayed,
      wins: t.intWin, draws: t.intDraw, losses: t.intLoss, goalsFor: t.intGoalsFor,
      goalsAgainst: t.intGoalsAgainst, goalDifference: t.intGoalDifference, points: t.intPoints,
      badge: t.strBadge,
    })),
  };
}

export async function getNextEvents(teamId: string): Promise<any> {
  const data = await fetchAPI(`/eventsnext.php?id=${encodeURIComponent(teamId)}`);
  if (!data.events) throw new Error(`No upcoming events found for team ${teamId}`);
  return {
    teamId,
    events: data.events.map((e: any) => ({
      id: e.idEvent, name: e.strEvent, league: e.strLeague, season: e.strSeason,
      homeTeam: e.strHomeTeam, awayTeam: e.strAwayTeam, date: e.dateEvent, time: e.strTime,
      venue: e.strVenue, thumbnail: e.strThumb, round: e.intRound,
    })),
  };
}

export async function getLastEvents(teamId: string): Promise<any> {
  const data = await fetchAPI(`/eventslast.php?id=${encodeURIComponent(teamId)}`);
  if (!data.results) throw new Error(`No past events found for team ${teamId}`);
  return {
    teamId,
    events: data.results.map((e: any) => ({
      id: e.idEvent, name: e.strEvent, league: e.strLeague, season: e.strSeason,
      homeTeam: e.strHomeTeam, awayTeam: e.strAwayTeam, homeScore: e.intHomeScore,
      awayScore: e.intAwayScore, date: e.dateEvent, venue: e.strVenue, round: e.intRound,
    })),
  };
}

export async function getEventsByDay(date: string, sport?: string): Promise<any> {
  let path = `/eventsday.php?d=${encodeURIComponent(date)}`;
  if (sport) path += `&s=${encodeURIComponent(sport)}`;
  const data = await fetchAPI(path);
  if (!data.events) throw new Error(`No events found for date ${date}`);
  return {
    date, sport: sport || "all",
    events: data.events.map((e: any) => ({
      id: e.idEvent, name: e.strEvent, league: e.strLeague, sport: e.strSport,
      homeTeam: e.strHomeTeam, awayTeam: e.strAwayTeam, homeScore: e.intHomeScore,
      awayScore: e.intAwayScore, time: e.strTime, status: e.strStatus,
      venue: e.strVenue,
    })),
  };
}

export async function getEventsByRound(leagueId: string, round: string, season: string): Promise<any> {
  const data = await fetchAPI(`/eventsround.php?id=${encodeURIComponent(leagueId)}&r=${encodeURIComponent(round)}&s=${encodeURIComponent(season)}`);
  if (!data.events) throw new Error(`No events found for round ${round}`);
  return {
    leagueId, round, season,
    events: data.events.map((e: any) => ({
      id: e.idEvent, name: e.strEvent, homeTeam: e.strHomeTeam, awayTeam: e.strAwayTeam,
      homeScore: e.intHomeScore, awayScore: e.intAwayScore, date: e.dateEvent,
      venue: e.strVenue,
    })),
  };
}

export async function getTeamDetails(teamId: string): Promise<any> {
  const data = await fetchAPI(`/lookupteam.php?id=${encodeURIComponent(teamId)}`);
  if (!data.teams) throw new Error(`No team found with ID ${teamId}`);
  const t = data.teams[0];
  return {
    id: t.idTeam, name: t.strTeam, sport: t.strSport, league: t.strLeague,
    country: t.strCountry, stadium: t.strStadium, stadiumCapacity: t.intStadiumCapacity,
    description: t.strDescriptionEN?.substring(0, 800),
    badge: t.strBadge, jersey: t.strJersey, logo: t.strLogo, banner: t.strBanner,
    formedYear: t.intFormedYear, website: t.strWebsite,
  };
}

export async function getPlayerDetails(playerId: string): Promise<any> {
  const data = await fetchAPI(`/lookupplayer.php?id=${encodeURIComponent(playerId)}`);
  if (!data.players) throw new Error(`No player found with ID ${playerId}`);
  const p = data.players[0];
  return {
    id: p.idPlayer, name: p.strPlayer, sport: p.strSport, team: p.strTeam,
    nationality: p.strNationality, position: p.strPosition, dateBorn: p.dateBorn,
    description: p.strDescriptionEN?.substring(0, 800),
    thumbnail: p.strThumb, height: p.strHeight, weight: p.strWeight,
    signing: p.strSigning, wage: p.strWage,
  };
}

export async function getEventDetails(eventId: string): Promise<any> {
  const data = await fetchAPI(`/lookupevent.php?id=${encodeURIComponent(eventId)}`);
  if (!data.events) throw new Error(`No event found with ID ${eventId}`);
  const e = data.events[0];
  return {
    id: e.idEvent, name: e.strEvent, sport: e.strSport, league: e.strLeague,
    season: e.strSeason, homeTeam: e.strHomeTeam, awayTeam: e.strAwayTeam,
    homeScore: e.intHomeScore, awayScore: e.intAwayScore, round: e.intRound,
    date: e.dateEvent, time: e.strTime, venue: e.strVenue,
    homeLineup: e.strHomeLineupGoalkeeper, awayLineup: e.strAwayLineupGoalkeeper,
    result: e.strResult, status: e.strStatus,
  };
}

export async function getAllLeagues(): Promise<any> {
  const data = await fetchAPI(`/all_leagues.php`);
  if (!data.leagues) throw new Error("Could not fetch leagues");
  return {
    total: data.leagues.length,
    leagues: data.leagues.slice(0, 50).map((l: any) => ({
      id: l.idLeague, name: l.strLeague, sport: l.strSport, alternate: l.strLeagueAlternate,
    })),
  };
}

export async function searchLeague(query: string): Promise<any> {
  const allData = await fetchAPI(`/all_leagues.php`);
  const match = allData.leagues?.filter((l: any) =>
    l.strLeague.toLowerCase().includes(query.toLowerCase()) ||
    l.strLeagueAlternate?.toLowerCase().includes(query.toLowerCase())
  );
  if (!match || match.length === 0) throw new Error(`No league found for "${query}"`);
  return {
    results: match.slice(0, 10).map((l: any) => ({
      id: l.idLeague, name: l.strLeague, sport: l.strSport, alternate: l.strLeagueAlternate,
    })),
  };
}

export async function getLeagueDetails(leagueId: string): Promise<any> {
  const data = await fetchAPI(`/lookupleague.php?id=${encodeURIComponent(leagueId)}`);
  if (!data.leagues) throw new Error(`No league found with ID ${leagueId}`);
  const l = data.leagues[0];
  return {
    id: l.idLeague, name: l.strLeague, sport: l.strSport, country: l.strCountry,
    description: l.strDescriptionEN?.substring(0, 800),
    badge: l.strBadge, logo: l.strLogo, banner: l.strBanner, trophy: l.strTrophy,
    formedYear: l.intFormedYear, website: l.strWebsite,
    facebook: l.strFacebook, twitter: l.strTwitter,
  };
}

export async function getLeagueSeasons(leagueId: string): Promise<any> {
  const data = await fetchAPI(`/search_all_seasons.php?id=${encodeURIComponent(leagueId)}`);
  if (!data.seasons) throw new Error(`No seasons found for league ${leagueId}`);
  return {
    leagueId,
    seasons: data.seasons.map((s: any) => s.strSeason),
  };
}

export async function getTeamPlayers(teamId: string): Promise<any> {
  const data = await fetchAPI(`/lookup_all_players.php?id=${encodeURIComponent(teamId)}`);
  if (!data.player) throw new Error(`No players found for team ${teamId}`);
  return {
    teamId,
    players: data.player.map((p: any) => ({
      id: p.idPlayer, name: p.strPlayer, position: p.strPosition,
      nationality: p.strNationality, dateBorn: p.dateBorn,
      thumbnail: p.strThumb, number: p.strNumber,
    })),
  };
}

export async function getTeamsByLeague(leagueId: string): Promise<any> {
  const data = await fetchAPI(`/lookup_all_teams.php?id=${encodeURIComponent(leagueId)}`);
  if (!data.teams) throw new Error(`No teams found for league ${leagueId}`);
  return {
    leagueId,
    teams: data.teams.map((t: any) => ({
      id: t.idTeam, name: t.strTeam, stadium: t.strStadium, badge: t.strBadge,
      country: t.strCountry, formedYear: t.intFormedYear,
    })),
  };
}

export async function getLiveScores(sport?: string): Promise<any> {
  let path = `/livescore.php`;
  if (sport) path += `?s=${encodeURIComponent(sport)}`;
  const data = await fetchAPI(path);
  if (!data.events) return { sport: sport || "all", events: [], message: "No live events at this time" };
  return {
    sport: sport || "all",
    events: data.events.map((e: any) => ({
      id: e.idEvent, name: e.strEvent, league: e.strLeague,
      homeTeam: e.strHomeTeam, awayTeam: e.strAwayTeam,
      homeScore: e.intHomeScore, awayScore: e.intAwayScore,
      status: e.strStatus, progress: e.strProgress, time: e.strTime,
    })),
  };
}

export async function getTeamsByCountry(country: string, sport?: string): Promise<any> {
  let path = `/search_all_teams.php?s=${encodeURIComponent(sport || "Soccer")}&c=${encodeURIComponent(country)}`;
  const data = await fetchAPI(path);
  if (!data.teams) throw new Error(`No teams found for country "${country}"`);
  return {
    country, sport: sport || "Soccer",
    teams: data.teams.map((t: any) => ({
      id: t.idTeam, name: t.strTeam, league: t.strLeague, stadium: t.strStadium,
      badge: t.strBadge,
    })),
  };
}

export async function getLeaguesByCountry(country: string, sport?: string): Promise<any> {
  let path = `/search_all_leagues.php?c=${encodeURIComponent(country)}`;
  if (sport) path += `&s=${encodeURIComponent(sport)}`;
  const data = await fetchAPI(path);
  if (!data.countries) throw new Error(`No leagues found for country "${country}"`);
  return {
    country, sport: sport || "all",
    leagues: data.countries.map((l: any) => ({
      id: l.idLeague, name: l.strLeague, sport: l.strSport, alternate: l.strLeagueAlternate,
    })),
  };
}

export async function getVenue(venueId: string): Promise<any> {
  const data = await fetchAPI(`/lookupvenue.php?id=${encodeURIComponent(venueId)}`);
  if (!data.venues) throw new Error(`No venue found with ID ${venueId}`);
  const v = data.venues[0];
  return {
    id: v.idVenue, name: v.strVenue, location: v.strLocation, country: v.strCountry,
    capacity: v.intCapacity, surface: v.strSurface, description: v.strDescriptionEN?.substring(0, 500),
    thumbnail: v.strThumb, map: v.strMap,
  };
}

export async function getEventLineup(eventId: string): Promise<any> {
  const data = await fetchAPI(`/lookuplineup.php?id=${encodeURIComponent(eventId)}`);
  if (!data.lineup) throw new Error(`No lineup found for event ${eventId}`);
  return {
    eventId,
    lineup: data.lineup.map((p: any) => ({
      player: p.strPlayer, team: p.strTeam, position: p.strPosition,
      substitute: p.strSubstitute === "Yes",
    })),
  };
}

export async function getEventStats(eventId: string): Promise<any> {
  const data = await fetchAPI(`/lookupeventstats.php?id=${encodeURIComponent(eventId)}`);
  if (!data.eventstats) throw new Error(`No stats found for event ${eventId}`);
  return {
    eventId,
    stats: data.eventstats.map((s: any) => ({
      stat: s.strStat, home: s.intHome, away: s.intAway,
    })),
  };
}

export async function getEventHighlights(eventId: string): Promise<any> {
  const data = await fetchAPI(`/lookupevent.php?id=${encodeURIComponent(eventId)}`);
  if (!data.events) throw new Error(`No event found with ID ${eventId}`);
  const e = data.events[0];
  return {
    id: e.idEvent, name: e.strEvent, video: e.strVideo || null,
    thumbnail: e.strThumb || e.strBanner, result: e.strResult,
    homeTeam: e.strHomeTeam, awayTeam: e.strAwayTeam,
    homeScore: e.intHomeScore, awayScore: e.intAwayScore,
  };
}

export async function getTeamEquipment(teamId: string): Promise<any> {
  const data = await fetchAPI(`/lookupequipment.php?id=${encodeURIComponent(teamId)}`);
  if (!data.equipment) throw new Error(`No equipment found for team ${teamId}`);
  return {
    teamId,
    equipment: data.equipment.map((e: any) => ({
      id: e.idEquipment, season: e.strSeason, type: e.strType,
      image: e.strEquipment,
    })),
  };
}
