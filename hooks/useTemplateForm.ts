import { useState, useEffect, useCallback } from "react";
import { formService } from "../services/formService";
import { TemplateData, GroupNode, OptionNode, InfoNode } from "../types/templates";
import { normalizeValue } from "../utils/templateUtils";

export const useTemplateForm = (id?: string) => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [template, setTemplate] = useState<TemplateData>({
    name: "",
    description: "",
    status: true,
    type: "phuluc",
    info: [],
    data: [
      {
        name: "",
        status: true,
        Roman: "roman",
        option: []
      }
    ]
  });

  const fetchTemplate = useCallback(async () => {
    if (!id) return;
    try {
      setFetching(true);
      const data = await formService.fetchFormById(id);
      const templateData = data?.data || data;
      if (templateData) {
        setTemplate({
          ...templateData,
          status: templateData.status === 'active' || templateData.status === 'true' || templateData.status === true
        });
      }
    } catch (error) {
      console.error("Lỗi khi tải biểu mẫu:", error);
      throw error;
    } finally {
      setFetching(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTemplate();
  }, [fetchTemplate]);

  const addGroup = () => {
    setTemplate((prev) => ({
      ...prev,
      data: [...prev.data, { name: "", status: true, Roman: "roman", option: [] }]
    }));
  };

  const updateGroup = (index: number, field: keyof GroupNode, val: any) => {
    const newData = [...template.data];
    newData[index] = { ...newData[index], [field]: val };
    setTemplate({ ...template, data: newData });
  };

  const removeGroup = (index: number) => {
    const newData = [...template.data];
    newData.splice(index, 1);
    setTemplate({ ...template, data: newData });
  };

  const addOption = (groupIndex: number) => {
    const nextKey = Math.max(0, ...template.data.flatMap(g => g.option.map(o => Number(o.key) || 0))) + 1;
    const newData = [...template.data];
    newData[groupIndex].option.push({
      key: nextKey,
      content: "",
      method: "",
      productOut: "",
      progress: { type: "tiendo", value: -1 },
      rating: { type: "danhgia", value: -1 },
      ratingVote: { type: "hailong", value: -1 },
      note: "",
      answerType: "score1_5",
      answerOptions: [],
      status: true
    });
    setTemplate({ ...template, data: newData });
  };

  const updateOption = (groupIndex: number, optionIndex: number, field: keyof OptionNode, val: any) => {
    const newData = [...template.data];
    newData[groupIndex].option[optionIndex] = { 
      ...newData[groupIndex].option[optionIndex], 
      [field]: val 
    };
    setTemplate({ ...template, data: newData });
  };

  const removeOption = (groupIndex: number, optionIndex: number) => {
    const newData = [...template.data];
    newData[groupIndex].option.splice(optionIndex, 1);
    setTemplate({ ...template, data: newData });
  };

  const addInfoField = () => {
    const currentInfo = template.info || [];
    const nextKey = currentInfo.length > 0
      ? Math.max(...currentInfo.map(i => Number(i.key) || 0)) + 1
      : 1;
    setTemplate((prev) => ({
      ...prev,
      info: [...(prev.info || []), { key: nextKey, title: "", value: "", type: "text", status: true, option: [] }]
    }));
  };

  const updateInfoField = (index: number, field: keyof InfoNode, val: any) => {
    const newInfo = [...(template.info || [])];
    newInfo[index] = { ...newInfo[index], [field]: val };
    if (field === 'title') {
      newInfo[index].value = normalizeValue(val);
    }
    setTemplate({ ...template, info: newInfo });
  };

  const removeInfoField = (index: number) => {
    const newInfo = [...(template.info || [])];
    newInfo.splice(index, 1);
    setTemplate({ ...template, info: newInfo });
  };

  const saveTemplate = async () => {
    try {
      setLoading(true);
      const cleanedData = template.data
        .map(group => ({
          ...group,
          option: group.option.filter(opt => opt.content && opt.content.trim() !== "")
        }))
        .filter(group => (group.option && group.option.length > 0) || (group.name && group.name.trim() !== ""));

      const cleanedInfo = (template.info || []).filter(info => info.title && info.title.trim() !== "");

      const payload = {
        ...template,
        data: cleanedData,
        info: cleanedInfo,
        status: template.status ? 'active' : 'inactive'
      };

      if (id) {
        await formService.updateForm(id, payload);
      } else {
        await formService.createForm(payload);
      }
      return true;
    } catch (error) {
      console.error("Lỗi khi lưu biểu mẫu:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    template,
    setTemplate,
    loading,
    fetching,
    addGroup,
    updateGroup,
    removeGroup,
    addOption,
    updateOption,
    removeOption,
    addInfoField,
    updateInfoField,
    removeInfoField,
    saveTemplate
  };
};
