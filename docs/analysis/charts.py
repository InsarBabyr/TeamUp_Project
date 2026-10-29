"""Draws the three analysis charts from the CSV files next to this script.

Re-run after exporting fresh results: run each qN_*.sql in Supabase -> SQL Editor,
download the result as CSV over the matching qN_*.csv, then:  python3 charts.py
"""
import csv
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

HERE = Path(__file__).parent
OUT = HERE / "charts"
OUT.mkdir(exist_ok=True)
SOURCE = "Source: TeamUp database (Supabase), synthetic test data, exported 29 Oct 2026"

INK, MUTED, GRID, SURFACE = "#0b0b0b", "#52514e", "#e6e5e0", "#fcfcfb"
BLUE, ORANGE = "#2a78d6", "#eb6834"                       # categorical slots 1-2 (validated pair)
STATUS = {"new": "#9a9893", "on_trial": "#fab219", "accepted": "#0ca30c", "rejected": "#d03b3b"}
LABEL = {"new": "New", "on_trial": "On trial", "accepted": "Accepted", "rejected": "Rejected"}

plt.rcParams.update({"font.size": 11, "axes.edgecolor": GRID, "axes.labelcolor": MUTED,
                     "xtick.color": MUTED, "ytick.color": INK, "axes.titleweight": "bold",
                     "axes.titlesize": 14, "axes.titlecolor": INK, "figure.facecolor": SURFACE,
                     "axes.facecolor": SURFACE})


def read(name):
    with open(HERE / name, newline="") as f:
        return list(csv.DictReader(f))


def finish(fig, ax, name, note=SOURCE):
    ax.spines[["top", "right"]].set_visible(False)
    ax.grid(axis="x", color=GRID, linewidth=0.8)
    ax.set_axisbelow(True)
    fig.text(0.01, 0.01, note, fontsize=8.5, color=MUTED, ha="left")
    fig.tight_layout(rect=(0, 0.04, 1, 1))
    fig.savefig(OUT / name, dpi=200)
    plt.close(fig)


# Q1: one series, horizontal bars so long skill names stay readable
rows = read("q1_most_wanted_skills.csv")[::-1]
fig, ax = plt.subplots(figsize=(9, 5.2))
names = [r["skill"] for r in rows]
vals = [int(r["projects"]) for r in rows]
bars = ax.barh(names, vals, height=0.6, color=BLUE)
for b, v in zip(bars, vals):
    ax.text(v + 0.4, b.get_y() + b.get_height() / 2, str(v), va="center", fontsize=10, color=INK)
ax.set_xlim(0, max(vals) * 1.12)
ax.set_xlabel("Open projects that list the skill (count, required or nice to have)")
ax.set_title("Q1. Most wanted skills in open projects (top 10)", loc="left")
finish(fig, ax, "q1_most_wanted_skills.png")

# Q2: 100% stacked bars, one per project type; every segment labelled with its count
rows = read("q2_outcomes_by_type.csv")
fig, ax = plt.subplots(figsize=(9, 4.2))
types = [r["project_type"].capitalize() for r in rows][::-1]
left = [0.0] * len(rows)
for st in ["accepted", "on_trial", "new", "rejected"]:
    counts = [int(r[st]) for r in rows][::-1]
    totals = [int(r["applications"]) for r in rows][::-1]
    share = [100 * c / t for c, t in zip(counts, totals)]
    bars = ax.barh(types, share, left=left, height=0.55, color=STATUS[st], label=LABEL[st],
                   edgecolor=SURFACE, linewidth=2)
    for b, c, s in zip(bars, counts, share):
        if s >= 6:
            ax.text(b.get_x() + s / 2, b.get_y() + b.get_height() / 2, str(c), ha="center",
                    va="center", fontsize=10, color="#ffffff" if st in ("accepted", "rejected") else INK)
    left = [l + s for l, s in zip(left, share)]
ax.set_xlim(0, 100)
ax.set_xlabel("Share of the type's applications (%)  ·  numbers in the bars are counts")
ax.set_title("Q2. How applications end, by project type", loc="left")
ax.legend(ncol=4, loc="upper left", bbox_to_anchor=(0, -0.22), frameon=False)
finish(fig, ax, "q2_outcomes_by_type.png")

# Q3: two series side by side per category (same unit: people/projects counted once each)
rows = [r for r in read("q3_demand_vs_supply.csv") if int(r["projects_needing"]) > 0][::-1]
fig, ax = plt.subplots(figsize=(9, 5))
y = list(range(len(rows)))
need = [int(r["projects_needing"]) for r in rows]
have = [int(r["students_with"]) for r in rows]
h = 0.36
b1 = ax.barh([i + h / 2 + 0.01 for i in y], need, height=h, color=BLUE, label="Open projects that require a skill from the area")
b2 = ax.barh([i - h / 2 - 0.01 for i in y], have, height=h, color=ORANGE, label="Students who list a skill from the area")
for bars, vals in ((b1, need), (b2, have)):
    for b, v in zip(bars, vals):
        ax.text(v + 0.5, b.get_y() + b.get_height() / 2, str(v), va="center", fontsize=9.5, color=INK)
ax.set_yticks(y, [r["category"] for r in rows])
ax.set_xlim(0, max(need + have) * 1.12)
ax.set_xlabel("Count (projects or students)")
ax.set_title("Q3. Demand vs supply of skills, by area", loc="left")
ax.legend(loc="upper left", bbox_to_anchor=(0, -0.13), frameon=False, ncol=1)
finish(fig, ax, "q3_demand_vs_supply.png",
       SOURCE + "  ·  areas with no open project left out: Cybersecurity, GameDev, Web3")
print("charts written to", OUT)
