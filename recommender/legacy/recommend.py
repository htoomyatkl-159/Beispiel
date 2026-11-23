
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.neighbors import NearestNeighbors

# ==========================================
# 1. LOAD THE MUSIC DATASET
# ==========================================
print("Loading music dataset...")

df = pd.read_csv("data/dataset.csv")

# ==========================================
# 2. CLEAN THE DATA
# ==========================================
df = df.dropna(subset=["track_name", "artists"])
df = df.drop_duplicates(subset=["track_id"]).reset_index(drop=True)

print(f"Songs available: {len(df)}")

# ==========================================
# 3. SELECT MUSICAL FEATURES
# ==========================================
features = [
    "danceability",
    "energy",
    "acousticness",
    "instrumentalness",
    "valence",
    "speechiness",
    "tempo",
    "loudness"
]

# ==========================================
# 4. SCALE THE FEATURES
# ==========================================
print("Preparing musical features...")

scaler = StandardScaler()
X = scaler.fit_transform(df[features])

# ==========================================
# 5. BUILD THE RECOMMENDATION MODEL
# ==========================================
print("Building recommendation model...")

model = NearestNeighbors(
    n_neighbors=6,
    metric="cosine",
    algorithm="brute"
)

model.fit(X)

print("\nMusic recommendation system is ready!")

# ==========================================
# 6. SEARCH FOR A SONG OR ARTIST
# ==========================================
search = input(
    "\nEnter a song title or artist name: "
).strip()

if not search:
    print("Please enter a song title or artist name.")

else:
    title_matches = df["track_name"].str.contains(
        search, case=False, regex=False, na=False
    )

    artist_matches = df["artists"].str.contains(
        search, case=False, regex=False, na=False
    )

    matches = df[title_matches | artist_matches]

    if matches.empty:
        print("No matching songs found.")
        print("Try a different title or artist name.")

    else:
        matches = matches.head(10)

        print("\nMatching songs:")

        for number, (_, song) in enumerate(
            matches.iterrows(), start=1
        ):
            print(
                f"{number}. {song['track_name']} "
                f"- {song['artists']}"
            )

        # ==========================================
        # 7. LET THE USER CHOOSE A SONG
        # ==========================================
        choice = input(
            "\nEnter the number of your chosen song: "
        ).strip()

        if choice.isdigit() and 1 <= int(choice) <= len(matches):

            selected = matches.iloc[int(choice) - 1]
            song_index = selected.name

            # ==========================================
            # 8. FIND SIMILAR SONGS
            # ==========================================
            distances, indices = model.kneighbors(
                X[song_index:song_index + 1]
            )

            print("\n" + "=" * 50)
            print("YOUR MUSIC RECOMMENDATIONS")
            print("=" * 50)

            print(
                f"Selected song: {selected['track_name']}"
            )
            print(f"Artist: {selected['artists']}")
            print("\nFive similar songs:\n")

            # ==========================================
            # 9. DISPLAY FIVE RECOMMENDATIONS
            # ==========================================
            for rank, (idx, distance) in enumerate(
                zip(indices[0][1:], distances[0][1:]),
                start=1
            ):
                song = df.iloc[idx]
                similarity = max(0, (1 - distance) * 100)

                print(
                    f"{rank}. {song['track_name']}"
                )
                print(f"   Artist: {song['artists']}")
                print(f"   Genre: {song['track_genre']}")
                print(
                    f"   Feature similarity: {similarity:.1f}%"
                )
                print()

            print("Recommendation process completed!")

        else:
            print(
                "Invalid selection. Please run the program again."
            )
