import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import { AllLocationsPdfCapture } from "./components/AllLocationsPdfCapture";
import { CameraPovModal } from "./components/CameraPovModal";
import { CameraPanel } from "./components/CameraPanel";
import { DoorPanel } from "./components/DoorPanel";
import { FloorCanvas } from "./components/FloorCanvas";
import { GenericObjectPanel } from "./components/GenericObjectPanel";
import { PersonObjectPanel } from "./components/PersonObjectPanel";
import { VisionAlerts } from "./components/VisionAlerts";
import { computeVisionConflicts } from "./fov";
import { downloadDomAsPdf } from "./pdf/captureToPdf";
import { useFloorPlan } from "./useFloorPlan";
import {
  isCamera,
  isDoor,
  isGeneric,
  isPerson,
  type Location,
} from "./types";

const AUTHOR_URL = "https://diego-perez.web.app";

function App() {
  const fp = useFloorPlan();
  const {
    locations,
    activeLocationId,
    setActiveLocationId,
    activeLocation,
    selectedId,
    setSelectedId,
    selectedObject,
    addLocation,
    renameLocation,
    addObject,
    patchObject,
    patchCamera,
    removeSelected,
    saveToLocalStorage,
  } = fp;

  const cameras = useMemo(
    () => activeLocation?.objects.filter(isCamera) ?? [],
    [activeLocation]
  );

  const maxFovRange = useMemo(() => {
    if (!activeLocation) return 2000;
    return Math.hypot(activeLocation.width, activeLocation.height) * 2;
  }, [activeLocation]);

  const conflicts = useMemo(
    () => computeVisionConflicts(cameras, maxFovRange),
    [cameras, maxFovRange]
  );

  const [editingLocationId, setEditingLocationId] = useState<string | null>(
    null
  );
  const [editingNameDraft, setEditingNameDraft] = useState("");
  const locationEditInputRef = useRef<HTMLInputElement>(null);
  const pdfCaptureRef = useRef<HTMLDivElement>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const saveMessageTimerRef = useRef<number | null>(null);
  const suppressLocationRenameBlurCommit = useRef(false);
  const [povCameraId, setPovCameraId] = useState<string | null>(null);

  const povCamera = useMemo(() => {
    if (!povCameraId || !activeLocation) return null;
    const o = activeLocation.objects.find((x) => x.id === povCameraId);
    return o && isCamera(o) ? o : null;
  }, [povCameraId, activeLocation]);

  useEffect(() => {
    if (povCameraId && !povCamera) setPovCameraId(null);
  }, [povCameraId, povCamera]);

  const commitEditingLocationIfAny = useCallback(() => {
    if (!editingLocationId) return;
    const loc = locations.find((l) => l.id === editingLocationId);
    if (loc) {
      const next = editingNameDraft.trim() || loc.name;
      if (next !== loc.name) renameLocation(editingLocationId, next);
    }
    setEditingLocationId(null);
  }, [editingLocationId, editingNameDraft, locations, renameLocation]);

  const selectLocation = useCallback(
    (locId: string) => {
      if (editingLocationId && editingLocationId !== locId) {
        commitEditingLocationIfAny();
      }
      setActiveLocationId(locId);
      setSelectedId(null);
    },
    [
      commitEditingLocationIfAny,
      editingLocationId,
      setActiveLocationId,
      setSelectedId,
    ]
  );

  const openLocationRename = useCallback(
    (loc: Location) => {
      if (editingLocationId && editingLocationId !== loc.id) {
        commitEditingLocationIfAny();
      }
      if (editingLocationId === loc.id) {
        queueMicrotask(() => locationEditInputRef.current?.focus());
        return;
      }
      setActiveLocationId(loc.id);
      setSelectedId(null);
      setEditingLocationId(loc.id);
      setEditingNameDraft(loc.name);
    },
    [
      commitEditingLocationIfAny,
      editingLocationId,
      setActiveLocationId,
      setSelectedId,
    ]
  );

  const cancelLocationRename = useCallback(() => {
    suppressLocationRenameBlurCommit.current = true;
    setEditingLocationId(null);
  }, []);

  useEffect(() => {
    if (!editingLocationId) return;
    const el = locationEditInputRef.current;
    if (!el) return;
    el.focus();
    el.select();
  }, [editingLocationId]);

  const addLocationWithEditFlush = useCallback(() => {
    commitEditingLocationIfAny();
    addLocation();
  }, [addLocation, commitEditingLocationIfAny]);

  const handleDownloadPdf = useCallback(async () => {
    commitEditingLocationIfAny();
    const el = pdfCaptureRef.current;
    if (!el || pdfBusy) return;
    setPdfBusy(true);
    try {
      await new Promise<void>((r) =>
        requestAnimationFrame(() => requestAnimationFrame(() => r()))
      );
      const stamp = new Date().toISOString().slice(0, 10);
      await downloadDomAsPdf(el, `planta-camaras-${stamp}`);
    } finally {
      setPdfBusy(false);
    }
  }, [commitEditingLocationIfAny, pdfBusy]);

  const handleSaveLocal = useCallback(() => {
    commitEditingLocationIfAny();
    const ok = saveToLocalStorage();
    if (saveMessageTimerRef.current !== null) {
      window.clearTimeout(saveMessageTimerRef.current);
    }
    setSaveMessage(
      ok
        ? "Guardado en este navegador. Al recargar la página se restaurará."
        : "No se pudo guardar (p. ej. modo privado o almacenamiento lleno)."
    );
    saveMessageTimerRef.current = window.setTimeout(() => {
      setSaveMessage(null);
      saveMessageTimerRef.current = null;
    }, 3200);
  }, [commitEditingLocationIfAny, saveToLocalStorage]);

  useEffect(() => {
    return () => {
      if (saveMessageTimerRef.current !== null) {
        window.clearTimeout(saveMessageTimerRef.current);
      }
    };
  }, []);

  if (!activeLocation) {
    return (
      <div className="app-shell">
        <div className="app-main">
          <p>No hay locaciones. Crea una para comenzar.</p>
          <button type="button" onClick={addLocation}>
            Nueva locación
          </button>
        </div>
        <footer className="app-footer">
          <div className="app-footer__left">
            Desarrollado por{" "}
            <a href={AUTHOR_URL} target="_blank" rel="noopener noreferrer">
              Diego Perez
            </a>
          </div>
          <div className="app-footer__center">UNPAZ</div>
          <div className="app-footer__spacer" aria-hidden="true" />
        </footer>
      </div>
    );
  }

  const showCameraPanel =
    selectedObject && isCamera(selectedObject) ? selectedObject : null;
  const showPersonPanel =
    selectedObject && isPerson(selectedObject) ? selectedObject : null;
  const showDoorPanel =
    selectedObject && isDoor(selectedObject) ? selectedObject : null;
  const showGenericPanel =
    selectedObject && isGeneric(selectedObject) ? selectedObject : null;

  return (
    <div className="app-shell">
      <div className="app-main">
        <header className="app-header">
          <h1 className="app-title">Planta de cámaras</h1>
          <p className="app-subtitle">
            Locaciones en canvas: cámaras, luces, personas, puertas y objetos
            genéricos (rectángulos). Arrastra para mover; usa el punto exterior
            para rotar. Las puertas se deslizan pegadas al borde del cuarto.
          </p>
        </header>

        <div className="app-layout">
          <nav className="locations-nav" aria-label="Locaciones">
            <div className="locations-nav__head">
              <span>Locaciones</span>
              <button
                type="button"
                className="btn btn--small"
                onClick={addLocationWithEditFlush}
              >
                + Nueva
              </button>
            </div>
            <ul className="locations-list">
              {locations.map((loc) => {
                const isActive = loc.id === activeLocationId;
                const isEditing = editingLocationId === loc.id;
                return (
                  <li key={loc.id}>
                    <div
                      className={
                        isActive ? "loc-row loc-row--active" : "loc-row"
                      }
                    >
                      {isEditing ? (
                        <input
                          ref={locationEditInputRef}
                          className="loc-tab__input loc-tab__input--edit"
                          value={editingNameDraft}
                          onChange={(e) => setEditingNameDraft(e.target.value)}
                          onBlur={() => {
                            if (suppressLocationRenameBlurCommit.current) {
                              suppressLocationRenameBlurCommit.current = false;
                              return;
                            }
                            commitEditingLocationIfAny();
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              commitEditingLocationIfAny();
                            }
                            if (e.key === "Escape") {
                              e.preventDefault();
                              cancelLocationRename();
                            }
                          }}
                          aria-label="Nombre de la locación"
                        />
                      ) : (
                        <button
                          type="button"
                          className="loc-tab"
                          onClick={() => selectLocation(loc.id)}
                        >
                          <span className="loc-tab__name">{loc.name}</span>
                        </button>
                      )}
                      {!isEditing && isActive ? (
                        <button
                          type="button"
                          className="loc-tab__edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            openLocationRename(loc);
                          }}
                          aria-label={`Editar nombre: ${loc.name}`}
                        >
                          Editar
                        </button>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </nav>

          <main className="workspace">
            <div
              className="toolbar"
              role="toolbar"
              aria-label="Agregar elementos"
            >
              <span className="toolbar__label">Agregar:</span>
              <button
                type="button"
                className="btn"
                onClick={() => addObject("camera")}
              >
                Cámara
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => addObject("light")}
              >
                Luz
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => addObject("person")}
              >
                Persona
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => addObject("door")}
              >
                Puerta
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => addObject("generic")}
              >
                Objeto
              </button>
              {selectedId && (
                <button
                  type="button"
                  className="btn btn--danger"
                  onClick={removeSelected}
                >
                  Eliminar selección
                </button>
              )}
              <button
                type="button"
                className="btn btn--secondary"
                onClick={handleSaveLocal}
              >
                Guardar
              </button>
              {saveMessage ? (
                <span className="toolbar__save-hint" role="status">
                  {saveMessage}
                </span>
              ) : null}
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => void handleDownloadPdf()}
                disabled={pdfBusy}
              >
                {pdfBusy
                  ? "Generando PDF…"
                  : "Descargar PDF (todas las locaciones)"}
              </button>
            </div>

            <div className="canvas-full-row">
              <FloorCanvas
                width={activeLocation.width}
                height={activeLocation.height}
                objects={activeLocation.objects}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onPatchObject={patchObject}
              />
            </div>

            <div className="panels-below">
              <div className="vision-column">
                <VisionAlerts conflicts={conflicts} />
              </div>

              {showCameraPanel ? (
                <CameraPanel
                  camera={showCameraPanel}
                  onOpenPov={() => setPovCameraId(showCameraPanel.id)}
                  onPatch={(patch) => patchCamera(showCameraPanel.id, patch)}
                />
              ) : showPersonPanel ? (
                <PersonObjectPanel
                  object={showPersonPanel}
                  onPatch={(patch) => patchObject(showPersonPanel.id, patch)}
                />
              ) : showDoorPanel ? (
                <DoorPanel
                  door={showDoorPanel}
                  onPatch={(patch) => patchObject(showDoorPanel.id, patch)}
                />
              ) : showGenericPanel ? (
                <GenericObjectPanel
                  object={showGenericPanel}
                  onPatch={(patch) => patchObject(showGenericPanel.id, patch)}
                />
              ) : (
                <aside className="camera-panel camera-panel--placeholder">
                  <p>
                    Selecciona una cámara, persona, puerta u objeto genérico en
                    el canvas para ver sus ajustes aquí.
                  </p>
                </aside>
              )}
            </div>
          </main>
        </div>
      </div>

      <footer className="app-footer">
        <div className="app-footer__left">
          Desarrollado por{" "}
          <a href={AUTHOR_URL} target="_blank" rel="noopener noreferrer">
            Diego Perez
          </a>
        </div>
        <div className="app-footer__center">UNPAZ</div>
        <div className="app-footer__spacer" aria-hidden="true" />
      </footer>

      <AllLocationsPdfCapture ref={pdfCaptureRef} locations={locations} />

      <CameraPovModal
        open={povCamera !== null}
        povCamera={povCamera}
        roomWidth={activeLocation.width}
        roomHeight={activeLocation.height}
        objects={activeLocation.objects}
        onClose={() => setPovCameraId(null)}
      />
    </div>
  );
}

export default App;
