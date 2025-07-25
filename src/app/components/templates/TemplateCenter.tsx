"use client";
import React, { useState } from "react";
import { XMarkIcon, ArrowLeftIcon, ShareIcon, DocumentTextIcon, CalendarIcon, UserIcon, ExclamationTriangleIcon, CurrencyDollarIcon, LinkIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

interface Template {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  statuses: string[];
  customFields: Array<{
    name: string;
    type: "text" | "number" | "date" | "select" | "url";
    required: boolean;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  }>;
  viewTypes: string[];
  createdBy: string;
  sharedWith: string;
  dateCreated: string;
  lastUsed: string;
  lastUpdate: string;
  usedCount: number;
}

interface TemplateCenterProps {
  open: boolean;
  onClose: () => void;
  onUseTemplate: (template: Template) => void;
}

const CONTRATACAO_SERVICOS_STATUSES = [
  "SOLICITAÇÃO RECEBIDA",
  "EM ANÁLISE",
  "EM ANÁLISE - GELI/GEJUR",
  "EM COTAÇÃO",
  "EM APROVAÇÃO",
  "EM ELABORAÇÃO",
  "EM ELABORAÇÃO DE CONTRATO",
  "EM PROCESSO DE ASSINATURA",
  "CONTRATO FINALIZADO",
  "EM PROCESSO DE PAGAMENTO",
  "AGUARDANDO FATURAMENTO",
  "ARQUIVADO E PAGO",
  "SOLICITAÇÃO NÃO RECEBIDA"
];

const CONTRATACAO_SERVICOS_FIELDS = [
  { name: "Prazo de Entrega", type: "date" as const, required: true, icon: CalendarIcon },
  { name: "Nº do Processo", type: "text" as const, required: true, icon: DocumentTextIcon },
  { name: "Tipo de Aquisição", type: "select" as const, required: true, icon: ExclamationTriangleIcon },
  { name: "Solicitante", type: "text" as const, required: true, icon: UserIcon },
  { name: "Status", type: "select" as const, required: true, icon: CheckCircleIcon },
  { name: "Valor", type: "number" as const, required: false, icon: CurrencyDollarIcon },
  { name: "Link para Documentos", type: "url" as const, required: false, icon: LinkIcon }
];

const TEMPLATES: Template[] = [
  {
    id: "contratacao-servicos",
    name: "Contratação de Serviço",
    description: "Template completo para gerenciamento de contratos de serviços, incluindo análise, aprovação, elaboração e pagamento.",
    thumbnail: "Contratação de Serviços",
    statuses: CONTRATACAO_SERVICOS_STATUSES,
    customFields: CONTRATACAO_SERVICOS_FIELDS,
    viewTypes: ["Visualização de Lista"],
    createdBy: "MP Marcela Pinho",
    sharedWith: "Todos os membros",
    dateCreated: "junho 10, 2025",
    lastUsed: "julho 21, 2025",
    lastUpdate: "junho 10, 2025",
    usedCount: 6
  }
];

export default function TemplateCenter({ open, onClose, onUseTemplate }: TemplateCenterProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showCustomFields, setShowCustomFields] = useState(false);
  const [showViewTypes, setShowViewTypes] = useState(false);

  if (!open) return null;

  const handleUseTemplate = () => {
    if (selectedTemplate) {
      onUseTemplate(selectedTemplate);
      onClose();
    }
  };

  const handleBack = () => {
    setSelectedTemplate(null);
    setShowCustomFields(false);
    setShowViewTypes(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="w-[900px] max-w-full bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-700 animate-fade-in max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-800">
          <div className="flex items-center gap-4">
            {selectedTemplate && (
              <button
                onClick={handleBack}
                className="text-neutral-400 hover:text-neutral-300 transition-colors duration-200"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-xl font-bold text-neutral-100">
              {selectedTemplate ? selectedTemplate.name : "Central de modelos"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-100 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!selectedTemplate ? (
            /* Template List */
            <div className="space-y-4">
              <p className="text-neutral-400 mb-6">
                Escolha um modelo para criar uma nova lista com statuses e campos pré-definidos.
              </p>
              {TEMPLATES.map((template) => (
                <div
                  key={template.id}
                  className="bg-neutral-800 rounded-xl p-4 border border-neutral-700 hover:border-primary-300 transition-colors duration-200 cursor-pointer"
                  onClick={() => setSelectedTemplate(template)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center">
                      <DocumentTextIcon className="w-8 h-8 text-neutral-900" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-neutral-100">{template.name}</h3>
                      <p className="text-neutral-400 text-sm mt-1">{template.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
                        <span>{template.statuses.length} status</span>
                        <span>{template.customFields.length} campos personalizados</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Template Details */
            <div className="grid grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="col-span-2 space-y-6">
                {/* Template Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <DocumentTextIcon className="w-6 h-6 text-neutral-400" />
                    <h3 className="text-lg font-semibold text-neutral-100">{selectedTemplate.name}</h3>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 text-neutral-400 hover:text-neutral-300 rounded-lg transition-colors">
                      <ShareIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleUseTemplate}
                      className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors duration-200"
                    >
                      Usar modelo
                    </button>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Etiquetas:
                  </label>
                  <input
                    type="text"
                    placeholder="Adicionar etiquetas..."
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {/* Template Preview */}
                <div className="bg-white rounded-lg p-6 text-center">
                  <h4 className="text-xl font-bold text-black mb-2">{selectedTemplate.thumbnail}</h4>
                  <p className="text-sm text-gray-600">PALESTRANTES/CONSULTORES</p>
                </div>

                {/* Description */}
                <div>
                  <h4 className="font-medium text-neutral-300 mb-2">Descrição do modelo</h4>
                  <p className="text-neutral-400 text-sm">
                    {selectedTemplate.description || "Nenhuma descrição..."}
                  </p>
                </div>

                {/* Custom Fields */}
                <div className="border border-neutral-700 rounded-lg">
                  <button
                    onClick={() => setShowCustomFields(!showCustomFields)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-neutral-800 transition-colors"
                  >
                    <span className="font-medium text-neutral-300">Campos personalizados</span>
                    <span className="text-neutral-500 text-sm">
                      {selectedTemplate.customFields.length} campos personalizados incluídos
                    </span>
                  </button>
                  {showCustomFields && (
                    <div className="px-4 pb-4 space-y-2">
                      {selectedTemplate.customFields.map((field, index) => (
                        <div key={index} className="flex items-center gap-3 text-sm">
                          <field.icon className="w-4 h-4 text-neutral-500" />
                          <span className="text-neutral-300">{field.name}</span>
                          {field.required && (
                            <span className="text-red-400 text-xs">*</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* View Types */}
                <div className="border border-neutral-700 rounded-lg">
                  <button
                    onClick={() => setShowViewTypes(!showViewTypes)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-neutral-800 transition-colors"
                  >
                    <span className="font-medium text-neutral-300">Tipos de visualização</span>
                    <span className="text-neutral-500 text-sm">
                      {selectedTemplate.viewTypes.length} tipo de visualização incluído
                    </span>
                  </button>
                  {showViewTypes && (
                    <div className="px-4 pb-4">
                      {selectedTemplate.viewTypes.map((viewType, index) => (
                        <div key={index} className="flex items-center gap-3 text-sm">
                          <DocumentTextIcon className="w-4 h-4 text-neutral-500" />
                          <span className="text-neutral-300">{viewType}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <div className="bg-neutral-800 rounded-lg p-4 space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                      DATA CRIADA
                    </h4>
                    <span className="text-neutral-300 text-sm">{selectedTemplate.dateCreated}</span>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                      USADO POR ÚLTIMO
                    </h4>
                    <span className="text-neutral-300 text-sm">{selectedTemplate.lastUsed}</span>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                      ÚLTIMA ATUALIZAÇÃO
                    </h4>
                    <span className="text-neutral-300 text-sm">{selectedTemplate.lastUpdate}</span>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                      USADO
                    </h4>
                    <span className="text-neutral-300 text-sm">{selectedTemplate.usedCount} vezes</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 