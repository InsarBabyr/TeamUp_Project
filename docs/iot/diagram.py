# Draws the D2 architecture diagram: python3 diagram.py (needs matplotlib) -> free_rooms_architecture.png
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch

layers = [
    ("1. Devices", "#dbeafe",
     "Sensor in each study room\n(PIR motion + ToF counter)\nCounts people: no camera,\nno phone or student IDs\nSends every 30 s"),
    ("2. Network", "#bfdbfe",
     "Campus LoRaWAN gateway\n(or campus Wi-Fi + HTTPS)\n~100 bytes per message\nOwn key for each sensor"),
    ("3. Cloud / processing", "#93c5fd",
     "Supabase (TeamUp's backend)\nEdge Function checks the key\nand writes table room_status\nRows older than 24 h deleted"),
    ("4. Application", "#60a5fa",
     "Card \"Free rooms\" in TeamUp\nUpdates live (Realtime)\nOnly for members of a\nteam marked 'assembled'"),
]

fig, ax = plt.subplots(figsize=(14.5, 4.8))
ax.set_xlim(0, 14.5); ax.set_ylim(0, 4.6); ax.axis("off")
w, h, gap, y = 3.1, 3.2, 0.5, 0.5
for i, (title, color, body) in enumerate(layers):
    x = 0.3 + i * (w + gap)
    ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.05,rounding_size=0.15",
                                fc=color, ec="#1e3a8a", lw=1.5))
    ax.text(x + w / 2, y + h - 0.35, title, ha="center", va="center", fontsize=12, weight="bold", color="#1e3a8a")
    ax.text(x + w / 2, y + h / 2 - 0.25, body, ha="center", va="center", fontsize=10, color="#0f172a", linespacing=1.5)
    if i < len(layers) - 1:
        ax.annotate("", xy=(x + w + gap - 0.05, y + h / 2), xytext=(x + w + 0.05, y + h / 2),
                    arrowprops=dict(arrowstyle="-|>", color="#1e3a8a", lw=2))
ax.text(7.25, 4.25, "TeamUp extension: \"Free rooms for your team\"", ha="center", fontsize=14, weight="bold", color="#1e3a8a")
ax.text(7.25, 0.15, "Data: room_id, occupied, people_count, measured_at   |   RLS: read only by assembled-team members   |   history deleted after 24 h",
        ha="center", fontsize=9, color="#334155")
fig.savefig("free_rooms_architecture.png", dpi=160, bbox_inches="tight", facecolor="white")
