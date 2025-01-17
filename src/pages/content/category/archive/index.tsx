import { PlusOutlined } from '@ant-design/icons';
import { Button, message, Modal, Space } from 'antd';
import React, { useState, useRef, useEffect } from 'react';
import { PageContainer } from '@ant-design/pro-layout';
import type { ProColumns, ActionType } from '@ant-design/pro-table';
import ProTable from '@ant-design/pro-table';
import { deleteCategory, getCategories, getCategoryInfo, getModules } from '@/services';
import '../index.less';
import CategoryForm from '../components/categoryFrom';
import { history } from 'umi';
import MultiCategory from '../components/multiCategory';

const ArchiveCategory: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<any[]>([]);
  const [currentCategory, setCurrentCategory] = useState<any>({});
  const [editVisible, setEditVisible] = useState<boolean>(false);
  const [modules, setModules] = useState<any[]>([]);
  const [multiVisible, setMultiVisible] = useState<boolean>(false);

  useEffect(() => {
    getModules().then((res) => {
      setModules(res.data || []);
    });
  }, []);

  const handleRemove = async (selectedRowKeys: any[]) => {
    Modal.confirm({
      title: '确定要删除选中的分类吗？',
      onOk: async () => {
        const hide = message.loading('正在删除', 0);
        if (!selectedRowKeys) return true;
        try {
          for (let item of selectedRowKeys) {
            await deleteCategory({
              id: item,
            });
          }
          hide();
          message.success('删除成功');
          if (actionRef.current) {
            actionRef.current.reload();
          }
          return true;
        } catch (error) {
          hide();
          message.error('删除失败');
          return true;
        }
      },
    });
  };

  const handleEditCategory = async (record: any) => {
    let category: any = null;
    if (record.id > 0) {
      const res = await getCategoryInfo({
        id: record.id,
      });
      category = res.data || record;
    } else {
      category = record;
    }

    setCurrentCategory(category);
    setEditVisible(true);
  };

  const handleAddMultiCategory = async (record: any) => {
    setCurrentCategory(record);
    setMultiVisible(true);
  };

  const handleShowArchives = (record: any) => {
    history.push('/archive/list?category_id=' + record.id);
  };

  const getModuleName = (moduleId: number) => {
    for (let item of modules) {
      if (moduleId == item.id) {
        return item.title;
      }
    }
    return null;
  };

  const columns: ProColumns<any>[] = [
    {
      title: '编号',
      dataIndex: 'id',
      hideInSearch: true,
    },
    {
      title: '排序',
      dataIndex: 'sort',
      hideInSearch: true,
    },
    {
      title: '分类名称',
      dataIndex: 'title',
      hideInSearch: true,
      render: (dom, entity) => {
        return (
          <>
            <div className="spacer" dangerouslySetInnerHTML={{ __html: entity.spacer }}></div>
            <a href={entity.link} target="_blank">
              {dom}
            </a>
          </>
        );
      },
    },
    {
      title: '内容模型',
      dataIndex: 'module_id',
      hideInSearch: true,
      render: (dom, entity) => {
        return getModuleName(entity.module_id);
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      hideInSearch: true,
      valueEnum: {
        0: {
          text: '隐藏',
          status: 'Default',
        },
        1: {
          text: '显示',
          status: 'Success',
        },
      },
    },
    {
      title: '操作',
      dataIndex: 'option',
      valueType: 'option',
      render: (_, record) => (
        <Space size={20}>
          <a
            key="edit"
            onClick={() => {
              handleShowArchives(record);
            }}
          >
            文档列表
          </a>
          <a
            key="edit"
            onClick={() => {
              handleEditCategory({ parent_id: record.id, module_id: record.module_id, status: 1 });
            }}
          >
            增加子类
          </a>
          <a
            key="edit"
            onClick={() => {
              handleAddMultiCategory({
                parent_id: record.id,
                module_id: record.module_id,
                status: 1,
              });
            }}
          >
            批量增加子类
          </a>
          <a
            key="edit"
            onClick={() => {
              handleEditCategory(record);
            }}
          >
            编辑
          </a>
          <a
            className="text-red"
            key="delete"
            onClick={async () => {
              await handleRemove([record.id]);
              setSelectedRowKeys([]);
              actionRef.current?.reloadAndRest?.();
            }}
          >
            删除
          </a>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      <ProTable<any>
        headerTitle="文档分类列表"
        actionRef={actionRef}
        rowKey="id"
        search={false}
        toolBarRender={() => [
          <Button
            key="add"
            onClick={() => {
              handleAddMultiCategory({ parent_id: 0, module_id: null, status: 1 });
            }}
          >
            批量添加分类
          </Button>,
          <Button
            type="primary"
            key="add"
            onClick={() => {
              handleEditCategory({ parent_id: 0, module_id: null, status: 1 });
            }}
          >
            <PlusOutlined /> 添加顶级分类
          </Button>,
        ]}
        tableAlertOptionRender={({ selectedRowKeys, onCleanSelected }) => (
          <Space>
            <Button
              size={'small'}
              onClick={async () => {
                await handleRemove(selectedRowKeys);
                setSelectedRowKeys([]);
                actionRef.current?.reloadAndRest?.();
              }}
            >
              批量删除
            </Button>
            <Button type="link" size={'small'} onClick={onCleanSelected}>
              取消选择
            </Button>
          </Space>
        )}
        request={(params) => {
          params.type = 1;
          return getCategories(params);
        }}
        columns={columns}
        rowSelection={{
          onChange: (selectedRowKeys) => {
            setSelectedRowKeys(selectedRowKeys);
          },
        }}
        pagination={{
          showSizeChanger: true,
        }}
      />
      {editVisible && (
        <CategoryForm
          visible={editVisible}
          category={currentCategory}
          modules={modules}
          type={1}
          onCancel={() => {
            setEditVisible(false);
          }}
          onSubmit={async () => {
            setEditVisible(false);
            if (actionRef.current) {
              actionRef.current.reload();
            }
          }}
        />
      )}
      {multiVisible && (
        <MultiCategory
          visible={multiVisible}
          category={currentCategory}
          modules={modules}
          type={1}
          onCancel={() => {
            setMultiVisible(false);
          }}
          onSubmit={async () => {
            setMultiVisible(false);
            if (actionRef.current) {
              actionRef.current.reload();
            }
          }}
        />
      )}
    </PageContainer>
  );
};

export default ArchiveCategory;
