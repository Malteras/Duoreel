# Fix: Partner's List movie modal shows spinner / "—" for IMDb rating

## Root cause

`SavedMoviesTab` passes `imdbRatingFromCard` to `MovieDetailModal` like this:

```tsx
imdbRatingFromCard={selectedMovie ? ((selectedMovie as any).imdbRating || null) : null}
```

Movie objects in SavedMoviesTab never have `.imdbRating` set on them — that field
doesn't exist. So the modal always receives `null`, shows the spinner, and tries
to fetch independently. This affects both My List and Partner's List, but is
more visible on Partner's List because `globalImdbCache` is less warm.

`MatchesTab` does it correctly — it reads from `globalImdbCache` using the
movie's IMDb ID:

```tsx
imdbRatingFromCard={selectedMovie?.external_ids?.imdb_id
  ? (globalImdbCache.get(selectedMovie.external_ids.imdb_id) || null)
  : null}
```

## Fix — one file: `src/app/components/SavedMoviesTab.tsx`

Find:
```tsx
        imdbRatingFromCard={selectedMovie ? ((selectedMovie as any).imdbRating || null) : null}
```

Replace with:
```tsx
        imdbRatingFromCard={selectedMovie?.external_ids?.imdb_id
          ? (globalImdbCache.get(selectedMovie.external_ids.imdb_id) ||
             imdbRatings.get(selectedMovie.id) ||
             null)
          : null}
```

The `imdbRatings.get(selectedMovie.id)` fallback catches cases where the rating
was fetched and stored in the local Map but not yet in globalImdbCache.

---

## Testing checklist
- [ ] Open any movie from My List → IMDb rating shows immediately (was already
      working for most, now consistent)
- [ ] Open any movie from Partner's List that has a rating on the card → modal
      shows the same rating instantly, no spinner
- [ ] Open a movie where IMDb hasn't loaded yet → spinner shows, then resolves
      (unchanged behaviour)