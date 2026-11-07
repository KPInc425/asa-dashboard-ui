import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchKits,
  saveKits,
  grantKit,
  fetchKitResults,
  emptyKit,
  type Kit,
  type KitItem,
} from "../api/kitApi";

/**
 * Kit editor.
 *
 * Everything here writes a file the KPTweaks mod polls. Nothing on this page can grant an
 * item, so the copy says "queued" and the results panel says what the mod actually
 * reported. Treating a queued grant as delivered is the mistake this page exists to avoid.
 */
export default function KitsPage() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Kit[] | null>(null);
  const [selected, setSelected] = useState<number>(0);
  const [playerId, setPlayerId] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const kitsQuery = useQuery({ queryKey: ["kits"], queryFn: fetchKits });
  const resultsQuery = useQuery({
    queryKey: ["kit-results"],
    queryFn: fetchKitResults,
    refetchInterval: 10000,
  });

  const saveMutation = useMutation({
    mutationFn: saveKits,
    onSuccess: (written) => {
      setDraft(written);
      setNotice(`${written.length} kit(s) written. The mod picks them up on its next poll.`);
      queryClient.invalidateQueries({ queryKey: ["kits"] });
    },
    onError: (error: unknown) =>
      setNotice(error instanceof Error ? error.message : "Save failed"),
  });

  const grantMutation = useMutation({
    mutationFn: ({ id, kit }: { id: string; kit: string }) => grantKit(id, kit),
    onSuccess: () => {
      setNotice("Queued. Delivery is confirmed only when the mod reports it below.");
      queryClient.invalidateQueries({ queryKey: ["kits"] });
    },
    onError: (error: unknown) =>
      setNotice(error instanceof Error ? error.message : "Grant failed"),
  });

  const kits = draft ?? kitsQuery.data?.kits ?? [];
  const status = kitsQuery.data?.status;
  const current = kits[selected];
  const busy = saveMutation.isPending || grantMutation.isPending;

  const patch = (index: number, changes: Partial<Kit>) => {
    const next = kits.map((kit, i) => (i === index ? { ...kit, ...changes } : kit));
    setDraft(next);
  };

  const patchItem = (index: number, itemIndex: number, changes: Partial<KitItem>) => {
    const kit = kits[index];
    if (!kit) return;
    const items = kit.items.map((item, i) => (i === itemIndex ? { ...item, ...changes } : item));
    patch(index, { items });
  };

  if (kitsQuery.isLoading) {
    return <div className="p-6">Loading kits...</div>;
  }

  if (kitsQuery.isError) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-2">Kits</h1>
        <p className="text-sm opacity-70">
          Could not reach the kit bridge. The API is up but the bridge endpoints may not be
          deployed yet.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Kits</h1>
          <p className="text-sm opacity-70">
            Kit definitions are written to the game box and read by the KPTweaks mod. Nothing
            here grants an item by itself.
          </p>
        </div>
        <div className="text-right text-xs opacity-70">
          <div>bridge: {status?.dir || "unknown"}</div>
          <div>
            {status?.kits ?? 0} kits, {status?.queued ?? 0} queued,{" "}
            {status?.processed ?? 0} reported
          </div>
        </div>
      </header>

      {notice && (
        <div className="rounded border border-[var(--border)] bg-[var(--card)] p-3 text-sm">
          {notice}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          className="rounded border border-[var(--border)] px-3 py-1.5 text-sm"
          onClick={() => {
            const next = [...kits, { ...emptyKit(), name: `kit${kits.length + 1}` }];
            setDraft(next);
            setSelected(next.length - 1);
          }}
        >
          Add kit
        </button>
        <button
          className="rounded border border-[var(--border)] px-3 py-1.5 text-sm"
          disabled={!draft || busy}
          onClick={() => saveMutation.mutate(kits)}
        >
          {saveMutation.isPending ? "Saving..." : "Save all kits"}
        </button>
        {draft && (
          <button
            className="rounded border border-[var(--border)] px-3 py-1.5 text-sm opacity-70"
            onClick={() => setDraft(null)}
          >
            Discard changes
          </button>
        )}
      </div>

      <div className="grid grid-cols-[220px_1fr] gap-6">
        <aside className="space-y-1">
          {kits.length === 0 && <p className="text-sm opacity-70">No kits defined yet.</p>}
          {kits.map((kit, index) => (
            <button
              key={`${kit.name}-${index}`}
              className={`block w-full rounded px-3 py-2 text-left text-sm ${
                index === selected
                  ? "bg-[var(--card)] border border-[var(--border)]"
                  : "opacity-80"
              }`}
              onClick={() => setSelected(index)}
            >
              <div className="font-medium">{kit.name || "(unnamed)"}</div>
              <div className="text-xs opacity-70">
                {kit.enabled ? "enabled" : "disabled"} · {kit.trigger} · {kit.items.length} items
              </div>
            </button>
          ))}
        </aside>

        <section className="space-y-5">
          {!current && <p className="text-sm opacity-70">Select or add a kit.</p>}

          {current && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <label className="text-sm">
                  <span className="block opacity-70 mb-1">Kit name</span>
                  <input
                    className="w-full rounded border border-[var(--border)] bg-transparent px-2 py-1.5"
                    value={current.name}
                    onChange={(e) => patch(selected, { name: e.target.value })}
                  />
                </label>
                <label className="text-sm">
                  <span className="block opacity-70 mb-1">Trigger</span>
                  <select
                    className="w-full rounded border border-[var(--border)] bg-transparent px-2 py-1.5"
                    value={current.trigger}
                    onChange={(e) =>
                      patch(selected, { trigger: e.target.value as Kit["trigger"] })
                    }
                  >
                    <option value="firstJoin">First join</option>
                    <option value="cooldown">Cooldown</option>
                    <option value="manual">Manual only</option>
                  </select>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={current.enabled}
                    onChange={(e) => patch(selected, { enabled: e.target.checked })}
                  />
                  Enabled
                </label>
                <label className="text-sm">
                  <span className="block opacity-70 mb-1">Cooldown seconds</span>
                  <input
                    type="number"
                    className="w-full rounded border border-[var(--border)] bg-transparent px-2 py-1.5"
                    value={current.cooldownSeconds}
                    onChange={(e) =>
                      patch(selected, { cooldownSeconds: Number(e.target.value) || 0 })
                    }
                  />
                </label>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-semibold">Items</h2>
                  <button
                    className="rounded border border-[var(--border)] px-2 py-1 text-xs"
                    onClick={() =>
                      patch(selected, {
                        items: [...current.items, { class: "", quantity: 1, quality: 0 }],
                      })
                    }
                  >
                    Add item
                  </button>
                </div>
                {current.items.length === 0 && (
                  <p className="text-sm opacity-70">No items in this kit.</p>
                )}
                <div className="space-y-2">
                  {current.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="grid grid-cols-[1fr_90px_90px_70px] gap-2">
                      <input
                        className="rounded border border-[var(--border)] bg-transparent px-2 py-1.5 text-sm font-mono"
                        placeholder="/Game/.../PrimalItem_X.PrimalItem_X_C"
                        value={item.class}
                        onChange={(e) =>
                          patchItem(selected, itemIndex, { class: e.target.value })
                        }
                      />
                      <input
                        type="number"
                        className="rounded border border-[var(--border)] bg-transparent px-2 py-1.5 text-sm"
                        value={item.quantity}
                        onChange={(e) =>
                          patchItem(selected, itemIndex, { quantity: Number(e.target.value) || 1 })
                        }
                      />
                      <input
                        type="number"
                        className="rounded border border-[var(--border)] bg-transparent px-2 py-1.5 text-sm"
                        value={item.quality ?? 0}
                        onChange={(e) =>
                          patchItem(selected, itemIndex, { quality: Number(e.target.value) || 0 })
                        }
                      />
                      <button
                        className="rounded border border-[var(--border)] px-2 py-1 text-xs"
                        onClick={() =>
                          patch(selected, {
                            items: current.items.filter((_, i) => i !== itemIndex),
                          })
                        }
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs opacity-60">
                  Class paths, not display names. Quantity is second, quality third.
                </p>
              </div>

              <div className="rounded border border-[var(--border)] p-4 space-y-3">
                <h2 className="text-sm font-semibold">Grant this kit</h2>
                <div className="flex gap-2">
                  <input
                    className="flex-1 rounded border border-[var(--border)] bg-transparent px-2 py-1.5 text-sm font-mono"
                    placeholder="player unique id (EOS id, not the in-game index)"
                    value={playerId}
                    onChange={(e) => setPlayerId(e.target.value)}
                  />
                  <button
                    className="rounded border border-[var(--border)] px-3 py-1.5 text-sm"
                    disabled={!playerId || !current.name || busy}
                    onClick={() =>
                      grantMutation.mutate({ id: playerId.trim(), kit: current.name })
                    }
                  >
                    {grantMutation.isPending ? "Queueing..." : "Queue grant"}
                  </button>
                </div>
                <p className="text-xs opacity-60">
                  Queueing is not delivery. The mod reports back in the results below.
                </p>
              </div>
            </>
          )}
        </section>
      </div>

      <section>
        <h2 className="text-sm font-semibold mb-2">Recent results</h2>
        {resultsQuery.data?.length ? (
          <table className="w-full text-sm">
            <thead className="text-left opacity-70">
              <tr>
                <th className="py-1">When</th>
                <th>Player</th>
                <th>Kit</th>
                <th>Granted</th>
                <th>Outcome</th>
              </tr>
            </thead>
            <tbody>
              {resultsQuery.data.map((r) => (
                <tr key={r.id} className="border-t border-[var(--border)]">
                  <td className="py-1 font-mono text-xs">{r.at || "-"}</td>
                  <td>{r.player || "-"}</td>
                  <td>{r.kit || "-"}</td>
                  <td>{r.granted ?? "-"}</td>
                  <td>{r.error ? `error: ${r.error}` : r.success ? "ok" : "unknown"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm opacity-70">
            Nothing reported yet. Results appear once the mod writes them.
          </p>
        )}
      </section>
    </div>
  );
}
