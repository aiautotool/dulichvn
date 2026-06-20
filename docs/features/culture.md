# Culture

The Culture tab shows short, practical guidance on Vietnamese customs. Each topic renders as a card with a **Nên** (do) or **Không nên** (avoid) badge, an explanation, and an Ask AI follow-up button.

## Screen Layout

- Vertical list of cards. Each card has:
  - A colored badge in the top-left: green for "Nên" (do) and red for "Không nên" (avoid).
  - The topic title in bold.
  - The explanation paragraph.
  - A heart button to save the topic as a culture favorite.
- After all cards, an "Ask AI" button.

The badge alternation is positional: even-indexed topics get "Nên", odd-indexed get "Không nên". This is a content-design decision to keep the screen visually balanced — adding a new topic at the end will produce another "Nên" entry.

## Source Map

| Symbol | Purpose |
| --- | --- |
| `cultureTopics` catalog | 4 topics in the MVP: traffic culture, temple etiquette, bargaining, coffee culture. |
| `CultureScreen` component | Renders the card grid. |
| `toggleFavorite('culture', id)` | Save button on each card. |

## Tracked Events

| Event | Trigger | Key params |
| --- | --- | --- |
| `favorite_added` / `favorite_removed` | Save button on a card | `item_type: 'culture'`, `item_id` |

The "Ask AI" button does not fire a dedicated event; the resulting AI call is captured by `ai_question_submitted` from the chat handler.

## Topics Included

| ID | Title | Category |
| --- | --- | --- |
| `temple_rules` | Nên: Cuối với và giữ thái đoan thành kính | Tôn giáo |
| `traffic_culture` | An toàn giao thông khi đi bộ | Đô thị |
| `bargaining` | Mặc cả ở chợ | Mua sắm |
| `coffee_culture` | Văn hóa cà phê | Ẩm thực |

## Edge Cases

- Adding a new topic to `cultureTopics` adds a new card with no other code change.
- Culture favorites are stored in the same `favorites` array as places/food/phrases, distinguished by `type: 'culture'`.
