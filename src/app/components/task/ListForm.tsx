/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useState, useEffect, useRef } from "react";
import { useSupabase } from "../../context/SupabaseContext";
import {
  ClipboardDocumentListIcon,
  FolderIcon,
  RocketLaunchIcon,
  XMarkIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import type { List } from "../../hooks/useLists";

interface ListFormProps {
  projectId: string;
  onListAdded: () => void;
  open: boolean;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLButtonElement> | null;
  initialType?: "sprint" | "lista" | "pasta";
  folderId?: string;
}

export default function ListForm({
  projectId,
  onListAdded,
  open,
  onClose,
  anchorRef,
  initialType,
  folderId,
  editingList,
}: ListFormProps & { editingList?: List | null }) {
  const { supabase } = useSupabase();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [type, setType] = useState<"sprint" | "lista" | "pasta" | null>(
    initialType ?? null,
  );
  const [effortType, setEffortType] = useState<"pontos" | "tempo" | "custom">(
    "pontos",
  );
  const [customEffort, setCustomEffort] = useState("");
  const [startDay, setStartDay] = useState("segunda-feira");
  const [duration, setDuration] = useState(7);
  const [statusConfig, setStatusConfig] = useState("");
  const [color, setColor] = useState<string>(editingList?.color || "#8884d8");
  const [colorName, setColorName] = useState<string>(editingList?.color_name || "");
  const [startDate, setStartDate] = useState<string>(editingList?.start_date || "");
  const [endDate, setEndDate] = useState<string>(editingList?.end_date || "");

  // Definir se está editando
  const isEditing = !!editingList;

  // Fechar popover ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        (!anchorRef ||
          !anchorRef.current ||
          !anchorRef.current.contains(event.target as Node))
      ) {
        onClose();
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, onClose, anchorRef]);

  useEffect(() => {
    if (editingList) {
      setName(editingList.name || "");
      setType(
        editingList.type === "sprint" || editingList.type === "lista" || editingList.type === "pasta"
          ? editingList.type
          : null
      );
      setColor(editingList.color || "#8884d8");
      setColorName(editingList.color_name || "");
      setStartDate(editingList.start_date || "");
      setEndDate(editingList.end_date || "");
      setError(null);
    } else if (!open) {
      setName("");
      setColor("#8884d8");
      setColorName("");
      setStartDate("");
      setEndDate("");
      setError(null);
    }
  }, [editingList, open]);

  useEffect(() => {
    if (initialType) setType(initialType);
    else setType(null);
  }, [initialType, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("O nome é obrigatório.");
      return;
    }
    if (!type) {
      setError("Selecione um tipo para criar.");
      return;
    }
    if (type === "sprint") {
      if (!startDay || !duration) {
        setError("Informe o dia de início e a duração do sprint.");
        return;
      }
    }
    setLoading(true);
    setError(null);
    try {
      if (editingList) {
        // Edição: update
        const { error } = await supabase
          .from("lists")
          .update({
            name,
            type,
            color,
            color_name: colorName,
            start_date: startDate || null,
            end_date: endDate || null,
            folder_id: folderId,
            effort_type: type === "sprint" ? effortType : undefined,
            custom_effort: type === "sprint" && effortType === "custom" ? customEffort : undefined,
            start_day: type === "sprint" ? startDay : undefined,
            duration: type === "sprint" ? duration : undefined,
          })
          .eq("id", editingList.id);
        if (error) setError(error.message);
        else {
          onListAdded();
          onClose();
        }
      } else {
        // Criação: insert
        type InsertList = {
          project_id: string;
          name: string;
          type: "sprint" | "lista" | "pasta";
          color?: string;
          color_name?: string;
          start_date?: string | null;
          end_date?: string | null;
          effort_type?: string;
          custom_effort?: string;
          start_day?: string;
          duration?: number;
          status_config?: string;
          folder_id?: string;
        };
        const insertData: InsertList = {
          project_id: projectId,
          name,
          type,
          color,
          color_name: colorName,
          start_date: startDate || null,
          end_date: endDate || null,
          folder_id: folderId,
          effort_type: type === "sprint" ? effortType : undefined,
          custom_effort:
            type === "sprint" && effortType === "custom" ? customEffort : undefined,
          start_day: type === "sprint" ? startDay : undefined,
          duration: type === "sprint" ? duration : undefined,
        };
        const { data, error } = await supabase.from("lists").insert(insertData).select().single();
        if (error) setError(error.message);
        else {
          // Se for pasta e statusConfig estiver preenchido, criar os status
          if ((type === "lista" || type === "sprint") && statusConfig.trim()) {
            const statusNames = statusConfig.split(",").map(s => s.trim()).filter(Boolean);
            if (statusNames.length > 0 && data?.id) {
              const statusRows = statusNames.map((name, idx) => ({
                name,
                list_id: data.id,
                order_index: idx,
              }));
              await supabase.from("statuses").insert(statusRows);
            }
          }
          onListAdded();
          onClose();
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Popover positioning
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});
  useEffect(() => {
    if (open && anchorRef && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      const popoverWidth = 384; // w-96
      const popoverHeight = 420; // Estimativa da altura do popover
      const margin = 16; // Margem de 1rem da borda da tela

      let top;
      let left = rect.left;

      // Prioridade: posicionar abaixo se houver espaço
      if (rect.bottom + popoverHeight < window.innerHeight - margin) {
        top = rect.bottom + 8;
      } else {
        // Senão, posicionar acima
        top = rect.top - popoverHeight - 8;
      }

      // Garantir que não saia do topo da tela
      if (top < margin) {
        top = margin;
      }

      // Ajustar horizontalmente para não sair da tela
      if (left + popoverWidth > window.innerWidth - margin) {
        left = window.innerWidth - popoverWidth - margin;
      }
      if (left < margin) {
        left = margin;
      }

      setPopoverStyle({
        position: "fixed",
        top,
        left,
        zIndex: 1000,
      });
    } else {
      setPopoverStyle({});
    }
  }, [open, anchorRef]);

  if (!open) return null;

  // Se anchorRef não está definido, renderiza modal centralizado
  if (!anchorRef) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
        <div className="w-[520px] max-w-full bg-[var(--color-background-primary)] rounded-3xl shadow-2xl p-10 border border-[var(--color-border-subtle)] animate-fade-in relative transition-all duration-200 flex flex-col max-h-[90vh] overflow-y-auto">
          {/* Botão de fechar */}
          <button
            type="button"
            className="absolute top-7 right-7 p-2 rounded-full hover:bg-[var(--color-hover)] text-[var(--color-icon-secondary)] hover:text-[var(--color-icon-primary)] transition"
            onClick={onClose}
            aria-label="Fechar"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
          {/* Título e subtítulo */}
          <div className="mb-6 text-center">
            <div className="flex items-center justify-center mb-2">
              {type === "pasta" && <FolderIcon className="w-7 h-7 text-[var(--color-icon-primary)] mr-2" />}
              {type === "sprint" && <RocketLaunchIcon className="w-7 h-7 text-[var(--color-icon-primary)] mr-2" />}
              {type === "lista" && <DocumentTextIcon className="w-7 h-7 text-[var(--color-icon-primary)] mr-2" />}
              <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
                {isEditing
                  ? type === "pasta"
                    ? "Editar pasta"
                    : type === "sprint"
                      ? "Editar sprint"
                      : "Editar lista"
                  : type === "pasta"
                    ? "Criar pasta"
                    : type === "sprint"
                      ? "Criar sprint"
                      : "Criar lista"}
              </h2>
            </div>
            <p className="text-[var(--color-text-secondary)] text-sm">
              {type === "pasta"
                ? "Agrupe listas, documentos e muito mais."
                : type === "sprint"
                  ? "Acompanhe sprints, tarefas e progresso."
                  : "Acompanhe tarefas, projetos, pessoas e muito mais."}
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Pasta: apenas nome */}
            {type === "pasta" && (
              <div>
                <label htmlFor="folder-name" className="block text-base font-medium text-[var(--color-text-primary)] mb-2">Nome da Pasta</label>
                <input
                  id="folder-name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full rounded-lg border border-[var(--color-border-subtle)] px-4 py-3 text-base bg-[var(--color-background-secondary)] text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] hover:border-[var(--color-hover)] transition-colors duration-200"
                  required
                  placeholder="Digite o nome da pasta"
                />
              </div>
            )}
            {/* Lista: nome, cor, nome da cor, datas */}
            {type === "lista" && (
              <>
                <div>
                  <label htmlFor="list-name" className="block text-base font-medium text-[var(--color-text-primary)] mb-2">Nome da Lista</label>
                  <input
                    id="list-name"
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full rounded-lg border border-[var(--color-border-subtle)] px-4 py-3 text-base bg-[var(--color-background-secondary)] text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] hover:border-[var(--color-hover)] transition-colors duration-200"
                    required
                    placeholder="Digite o nome da lista"
                  />
                </div>
                <div className="flex flex-col gap-2 mb-2">
                  <div className="flex items-center gap-4">
                    <label className="block text-base font-medium text-[var(--color-text-primary)]">Cor</label>
                    <input
                      type="color"
                      value={color}
                      onChange={e => setColor(e.target.value)}
                      className="w-10 h-10 p-0 border-none bg-transparent cursor-pointer"
                      title="Escolha a cor da lista"
                    />
                    <input
                      type="text"
                      value={colorName}
                      onChange={e => setColorName(e.target.value)}
                      placeholder="Nome da cor (ex: Financeiro, Educacional, Jurídico)"
                      className="rounded-lg border border-[var(--color-border-subtle)] px-3 py-2 text-base bg-[var(--color-background-secondary)] text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
                      maxLength={24}
                    />
                    <span className="inline-block w-8 h-8 rounded-full border border-[var(--color-border-subtle)]" style={{ background: color }} title={colorName || color} />
                  </div>
                  <div className="text-xs text-[var(--color-text-secondary)] ml-1">
                    A cor e o nome serão exibidos no dashboard e na sidebar para indicar o tipo ou área da lista (ex: <b>Financeiro</b>, <b>Jurídico</b>, <b>RH</b>).
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-4 mb-2">
                  <div className="flex-1 flex flex-col">
                    <label className="block text-base font-medium text-[var(--color-text-primary)] mb-1">Início</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="rounded-lg border border-[var(--color-border-subtle)] px-3 py-2 text-base bg-[var(--color-background-secondary)] text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
                    />
                  </div>
                  <div className="flex-1 flex flex-col">
                    <label className="block text-base font-medium text-[var(--color-text-primary)] mb-1">Término</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className="rounded-lg border border-[var(--color-border-subtle)] px-3 py-2 text-base bg-[var(--color-background-secondary)] text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
                    />
                  </div>
                </div>
              </>
            )}
            {/* Sprint: nome, cor, nome da cor, datas, campos de sprint */}
            {type === "sprint" && (
              <>
                <div>
                  <label htmlFor="sprint-name" className="block text-base font-medium text-[var(--color-text-primary)] mb-2">Nome do Sprint</label>
                  <input
                    id="sprint-name"
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full rounded-lg border border-[var(--color-border-subtle)] px-4 py-3 text-base bg-[var(--color-background-secondary)] text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] hover:border-[var(--color-hover)] transition-colors duration-200"
                    required
                    placeholder="Digite o nome do sprint"
                  />
                </div>
                <div className="flex flex-col gap-2 mb-2">
                  <div className="flex items-center gap-4">
                    <label className="block text-base font-medium text-[var(--color-text-primary)]">Cor</label>
                    <input
                      type="color"
                      value={color}
                      onChange={e => setColor(e.target.value)}
                      className="w-10 h-10 p-0 border-none bg-transparent cursor-pointer"
                      title="Escolha a cor do sprint"
                    />
                    <input
                      type="text"
                      value={colorName}
                      onChange={e => setColorName(e.target.value)}
                      placeholder="Nome da cor (ex: Financeiro, Educacional, Jurídico)"
                      className="rounded-lg border border-[var(--color-border-subtle)] px-3 py-2 text-base bg-[var(--color-background-secondary)] text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
                      maxLength={24}
                    />
                    <span className="inline-block w-8 h-8 rounded-full border border-[var(--color-border-subtle)]" style={{ background: color }} title={colorName || color} />
                  </div>
                  <div className="text-xs text-[var(--color-text-secondary)] ml-1">
                    A cor e o nome serão exibidos no dashboard e na sidebar para indicar o tipo ou área do sprint (ex: <b>Financeiro</b>, <b>Jurídico</b>, <b>RH</b>).
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-4 mb-2">
                  <div className="flex-1 flex flex-col">
                    <label className="block text-base font-medium text-[var(--color-text-primary)] mb-1">Início</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="rounded-lg border border-[var(--color-border-subtle)] px-3 py-2 text-base bg-[var(--color-background-secondary)] text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
                    />
                  </div>
                  <div className="flex-1 flex flex-col">
                    <label className="block text-base font-medium text-[var(--color-text-primary)] mb-1">Término</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className="rounded-lg border border-[var(--color-border-subtle)] px-3 py-2 text-base bg-[var(--color-background-secondary)] text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
                    />
                  </div>
                </div>
                {/* Campos específicos de sprint */}
                <div className="flex flex-col gap-2 mb-2">
                  <label className="block text-base font-medium text-[var(--color-text-primary)] mb-1">Medida de esforço</label>
                  <select
                    value={effortType}
                    onChange={(e) => setEffortType(e.target.value as "pontos" | "tempo" | "custom")}
                    className="w-full rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-background-secondary)] text-[var(--color-text-primary)] px-4 py-3 text-base"
                  >
                    <option value="pontos">Pontos do Sprint</option>
                    <option value="tempo">Estimativa de tempo</option>
                    <option value="custom">Campo personalizado</option>
                  </select>
                  {effortType === "custom" && (
                    <input
                      type="text"
                      placeholder="Nome do campo personalizado"
                      value={customEffort}
                      onChange={(e) => setCustomEffort(e.target.value)}
                      className="w-full rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-background-secondary)] text-[var(--color-text-primary)] px-4 py-3 text-base mt-2"
                    />
                  )}
                </div>
                <div className="flex flex-col md:flex-row gap-4 mb-2">
                  <div className="flex-1 flex flex-col">
                    <label className="block text-base font-medium text-[var(--color-text-primary)] mb-1">Dia de início do sprint</label>
                    <select
                      value={startDay}
                      onChange={(e) => setStartDay(e.target.value)}
                      className="w-full rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-background-secondary)] text-[var(--color-text-primary)] px-4 py-3 text-base"
                    >
                      <option value="segunda-feira">Segunda-feira</option>
                      <option value="terça-feira">Terça-feira</option>
                      <option value="quarta-feira">Quarta-feira</option>
                      <option value="quinta-feira">Quinta-feira</option>
                      <option value="sexta-feira">Sexta-feira</option>
                      <option value="sábado">Sábado</option>
                      <option value="domingo">Domingo</option>
                    </select>
                  </div>
                  <div className="flex-1 flex flex-col">
                    <label className="block text-base font-medium text-[var(--color-text-primary)] mb-1">Duração (dias)</label>
                    <input
                      type="number"
                      min={1}
                      value={duration}
                      onChange={e => setDuration(Number(e.target.value))}
                      className="w-full rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-background-secondary)] text-[var(--color-text-primary)] px-4 py-3 text-base"
                      required
                    />
                  </div>
                </div>
              </>
            )}
            {!isEditing && (
              <p className="text-xs text-[var(--color-text-secondary)]">
                Os status devem ser criados após a lista ser criada, usando o botão <b>+ novo status</b> no board.
              </p>
            )}
            {error && (
              <div className="text-[var(--color-destructive, #ef4444)] text-sm bg-[var(--color-background-secondary)] border border-[var(--color-border-subtle)] rounded-lg px-3 py-2">
                {error}
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 bg-[var(--color-highlight)] hover:bg-[var(--color-hover)] text-[var(--color-text-primary)] border border-[var(--color-border-subtle)] rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                {loading
                  ? (isEditing
                      ? type === "pasta"
                        ? "Salvando..."
                        : type === "sprint"
                          ? "Salvando..."
                          : "Salvando..."
                      : type === "pasta"
                        ? "Criando..."
                        : type === "sprint"
                          ? "Criando..."
                          : "Criando...")
                  : isEditing
                    ? type === "pasta"
                      ? "Salvar Pasta"
                      : type === "sprint"
                        ? "Salvar Sprint"
                        : "Salvar Lista"
                    : type === "pasta"
                      ? "Criar Pasta"
                      : type === "sprint"
                        ? "Criar Sprint"
                        : "Criar Lista"}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-3 text-[var(--color-text-primary)] bg-[var(--color-background-secondary)] hover:bg-[var(--color-hover)] border border-[var(--color-border-subtle)] rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Caso anchorRef esteja definido, renderiza como popover (comportamento antigo)
  return (
    <div
      ref={popoverRef}
      style={popoverStyle}
      className="w-[520px] max-w-full bg-[var(--color-background-primary)] rounded-3xl shadow-2xl p-10 border border-[var(--color-border-subtle)] animate-fade-in relative transition-all duration-200 flex flex-col"
    >
      {/* Botão de fechar */}
      <button
        type="button"
        className="absolute top-7 right-7 p-2 rounded-full hover:bg-[var(--color-hover)] text-[var(--color-icon-secondary)] hover:text-[var(--color-icon-primary)] transition"
        onClick={onClose}
        aria-label="Fechar"
      >
        <XMarkIcon className="w-6 h-6" />
      </button>
      {/* Escolha de tipo, se não definido */}
      {!type && (
        <div className="flex flex-col items-center justify-center gap-6 py-8">
          <div className="text-lg font-bold text-[var(--color-text-primary)] mb-2">O que deseja criar?</div>
          <div className="flex gap-4">
            <button
              type="button"
              className="px-6 py-3 rounded-lg bg-[var(--color-background-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)] border border-[var(--color-border-subtle)] font-semibold text-base transition-colors duration-200"
              onClick={() => setType("pasta")}
            >
              Pasta
            </button>
            <button
              type="button"
              className="px-6 py-3 rounded-lg bg-[var(--color-background-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)] border border-[var(--color-border-subtle)] font-semibold text-base transition-colors duration-200"
              onClick={() => setType("lista")}
            >
              Lista
            </button>
            <button
              type="button"
              className="px-6 py-3 rounded-lg bg-[var(--color-background-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)] border border-[var(--color-border-subtle)] font-semibold text-base transition-colors duration-200"
              onClick={() => setType("sprint")}
            >
              Sprint
            </button>
          </div>
        </div>
      )}
      {/* Título e subtítulo + formulário */}
      {type && (
        <>
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] flex items-center justify-center gap-3 mb-2">
          {type === "sprint" && (
            <RocketLaunchIcon className="w-7 h-7 text-[var(--color-icon-primary)]" />
          )}
          {type === "lista" && (
            <ClipboardDocumentListIcon className="w-7 h-7 text-[var(--color-icon-primary)]" />
          )}
          {type === "pasta" && <FolderIcon className="w-7 h-7 text-[var(--color-icon-primary)]" />}
          {type === "sprint" && "Criar pasta de sprint"}
          {type === "lista" && "Criar lista"}
          {type === "pasta" && "Criar pasta"}
        </h2>
        {type === "sprint" && (
          <p className="text-base text-[var(--color-text-secondary)] mt-1">
            A pasta do sprint ajuda a manter seus sprints organizados e permite
            que você gerencie configurações específicas do sprint.
          </p>
        )}
        {type === "lista" && (
          <p className="text-base text-[var(--color-text-secondary)] mt-1">
            Acompanhe tarefas, projetos, pessoas e muito mais.
          </p>
        )}
        {type === "pasta" && (
          <p className="text-base text-[var(--color-text-secondary)] mt-1">
            Agrupe listas, documentos e muito mais.
          </p>
        )}
      </div>
      {/* Formulário só aparece se type estiver selecionado */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          <div>
            <label
              className="block text-base font-medium text-[var(--color-text-primary)] mb-2"
              htmlFor="name"
            >
              {type === "sprint"
                ? "Nome da Pasta"
                : type === "lista"
                  ? "Nome da Lista"
                  : "Nome da Pasta"}
            </label>
            <input
              id="name"
              type="text"
              placeholder={
                type === "sprint"
                  ? "Pasta do sprint"
                  : type === "lista"
                    ? "Nome da Lista"
                    : "Nome da Pasta"
              }
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-background-secondary)] text-[var(--color-text-primary)] px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)] transition font-sans"
              required
            />
          </div>
          {/* Bloco de cor e nome da cor - sempre visível para lista e sprint */}
          {(type === "lista" || type === "sprint") && (
            <div>
              <div className="flex flex-col gap-2 mb-2">
                <div className="flex items-center gap-4">
                  <label className="block text-base font-medium text-[var(--color-text-primary)]">Cor</label>
                  <input
                    type="color"
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    className="w-10 h-10 p-0 border-none bg-transparent cursor-pointer"
                    title="Escolha a cor da lista"
                  />
                  <input
                    type="text"
                    value={colorName}
                    onChange={e => setColorName(e.target.value)}
                    placeholder="Nome da cor (ex: Financeiro, Educacional, Jurídico)"
                    className="rounded-lg border border-[var(--color-border-subtle)] px-3 py-2 text-base bg-[var(--color-background-secondary)] text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
                    maxLength={24}
                  />
                  <span className="inline-block w-8 h-8 rounded-full border border-[var(--color-border-subtle)]" style={{ background: color }} title={colorName || color} />
                </div>
                <div className="text-xs text-[var(--color-text-secondary)] ml-1">
                  A cor e o nome serão exibidos no dashboard e na sidebar para indicar o tipo ou área da lista (ex: <b>Financeiro</b>, <b>Jurídico</b>, <b>RH</b>).
                </div>
              </div>
              {/* Campos de data de início e término */}
              <div className="flex flex-col md:flex-row gap-4 mb-2">
                <div className="flex-1 flex flex-col">
                  <label className="block text-base font-medium text-[var(--color-text-primary)] mb-1">Início</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="rounded-lg border border-[var(--color-border-subtle)] px-3 py-2 text-base bg-[var(--color-background-secondary)] text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
                  />
                </div>
                <div className="flex-1 flex flex-col">
                  <label className="block text-base font-medium text-[var(--color-text-primary)] mb-1">Término</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="rounded-lg border border-[var(--color-border-subtle)] px-3 py-2 text-base bg-[var(--color-background-secondary)] text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
                  />
                </div>
              </div>
            </div>
          )}
          {type === "sprint" && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                <label className="block text-base font-medium text-[var(--color-text-primary)] mb-2">
                  Medida de esforço
                </label>
                <select
                  value={effortType}
                  onChange={(e) =>
                    setEffortType(
                      e.target.value as "pontos" | "tempo" | "custom",
                    )
                  }
                  className="w-full rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-background-secondary)] text-[var(--color-text-primary)] px-4 py-3 text-base"
                >
                  <option value="pontos">Pontos do Sprint</option>
                  <option value="tempo">Estimativa de tempo</option>
                  <option value="custom">Campo personalizado</option>
                </select>
                {effortType === "custom" && (
                  <input
                    type="text"
                    placeholder="Nome do campo personalizado"
                    value={customEffort}
                    onChange={(e) => setCustomEffort(e.target.value)}
                    className="w-full rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-background-secondary)] text-[var(--color-text-primary)] px-4 py-3 text-base mt-2"
                  />
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="block text-base font-medium text-[var(--color-text-primary)] mb-2">
                    Dia de início do sprint
                  </label>
                  <select
                    value={startDay}
                    onChange={(e) => setStartDay(e.target.value)}
                    className="w-full rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-background-secondary)] text-[var(--color-text-primary)] px-4 py-3 text-base"
                  >
                    <option value="segunda-feira">Segunda-feira</option>
                    <option value="terça-feira">Terça-feira</option>
                    <option value="quarta-feira">Quarta-feira</option>
                    <option value="quinta-feira">Quinta-feira</option>
                    <option value="sexta-feira">Sexta-feira</option>
                    <option value="sábado">Sábado</option>
                    <option value="domingo">Domingo</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="block text-base font-medium text-[var(--color-text-primary)] mb-2">
                    Duração do sprint
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-background-secondary)] text-[var(--color-text-primary)] px-4 py-3 text-base"
                    required
                  />
                </div>
              </div>
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-1">
                  <FolderIcon className="w-5 h-5 text-[var(--color-icon-primary)]" />
                  <span className="font-semibold text-[var(--color-text-primary)]">
                    Configurações do sprint
                  </span>
                </div>
                <div className="text-xs text-[var(--color-text-secondary)]">
                  Formato, fuso horário, data de início, hora de início, + 1 ...
                </div>
              </div>
            </div>
          )}
          {/* No JSX, remova o campo de statusConfig e adicione orientação */}
          {(type === "lista" || type === "sprint") && (
            <div className="flex flex-col gap-4">
              <span className="text-xs text-[var(--color-text-secondary)]">
                Os status devem ser criados após a lista ser criada, usando o botão <b>+ novo status</b> no board.
              </span>
            </div>
          )}
          {error && (
            <div className="text-[var(--color-text-error)] text-sm animate-shake">
              {error}
            </div>
          )}
          <div className="flex items-center gap-4 mt-8">
            <button
              type="submit"
              className="rounded-lg bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-[var(--color-text-white)] font-semibold py-3 px-8 text-base shadow transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed font-sans focus:ring-2 focus:ring-[var(--color-primary-500)]"
              disabled={loading}
            >
              {loading
                ? "Criando..."
                : type === "sprint"
                  ? "Próximo"
                  : type === "lista"
                    ? "Criar Lista"
                    : "Criar Pasta"}
            </button>
            <button
              type="button"
              className="rounded-lg bg-[var(--color-background-tertiary)] hover:bg-[var(--color-background-secondary)] text-[var(--color-text-primary)] font-semibold py-3 px-8 text-base shadow transition-colors duration-200 font-sans"
              onClick={onClose}
            >
              Cancelar
            </button>
          </div>
        </form>
        </>
      )}
    </div>
  );
}
