/**
 * 帮助中心组件
 * 提供用户手册、常见问题、技术支持等功能
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  TextField,
  Button,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Avatar,
  Divider,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating,
  Alert,
  Breadcrumbs,
  Link,
  IconButton
} from '@mui/material';
import {
  Help,
  Search,
  MenuBook,
  QuestionAnswer,
  ContactSupport,
  VideoLibrary,
  Download,
  Print,
  Share,
  ThumbUp,
  ThumbDown,
  ExpandMore,
  NavigateNext,
  Phone,
  Email,
  Chat,
  BugReport,
  Lightbulb,
  School,
  Article,
  PlayCircle,
  GetApp,
  Star,
  StarBorder,
  Feedback,
  Close
} from '@mui/icons-material';

const HelpCenter = () => {
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState({
    type: 'suggestion',
    title: '',
    description: '',
    rating: 5
  });
  const [helpData, setHelpData] = useState({
    categories: [],
    articles: [],
    faqs: [],
    videos: [],
    downloads: []
  });

  useEffect(() => {
    loadHelpData();
  }, []);

  const loadHelpData = async () => {
    // 模拟帮助数据
    const data = {
      categories: [
        {
          id: 1,
          name: '快速入门',
          icon: 'School',
          description: '系统基础操作和快速上手指南',
          articleCount: 8
        },
        {
          id: 2,
          name: '设备管理',
          icon: 'Settings',
          description: '设备添加、配置和管理相关帮助',
          articleCount: 12
        },
        {
          id: 3,
          name: '能源监控',
          icon: 'MonitorHeart',
          description: '能源数据监控和分析功能说明',
          articleCount: 15
        },
        {
          id: 4,
          name: '报告生成',
          icon: 'Assessment',
          description: '各类报告的生成和导出操作',
          articleCount: 10
        },
        {
          id: 5,
          name: '系统设置',
          icon: 'AdminPanelSettings',
          description: '系统配置和用户管理相关内容',
          articleCount: 6
        },
        {
          id: 6,
          name: '故障排除',
          icon: 'BugReport',
          description: '常见问题解决方案和故障排除',
          articleCount: 9
        }
      ],
      articles: [
        {
          id: 1,
          categoryId: 1,
          title: '系统登录和界面介绍',
          summary: '了解如何登录系统以及主界面的各个功能区域',
          content: '详细的系统登录和界面介绍内容...',
          tags: ['登录', '界面', '基础'],
          readTime: 5,
          helpful: 25,
          notHelpful: 2,
          lastUpdated: '2024-01-15'
        },
        {
          id: 2,
          categoryId: 1,
          title: '添加第一个设备',
          summary: '步骤详解如何在系统中添加和配置您的第一个监控设备',
          content: '添加设备的详细步骤说明...',
          tags: ['设备', '添加', '配置'],
          readTime: 8,
          helpful: 32,
          notHelpful: 1,
          lastUpdated: '2024-01-14'
        },
        {
          id: 3,
          categoryId: 2,
          title: '设备状态监控',
          summary: '如何查看和理解设备的各种状态信息',
          content: '设备状态监控的详细说明...',
          tags: ['设备', '状态', '监控'],
          readTime: 6,
          helpful: 18,
          notHelpful: 3,
          lastUpdated: '2024-01-13'
        },
        {
          id: 4,
          categoryId: 3,
          title: '能源数据分析',
          summary: '学习如何分析能源消耗数据并生成有用的洞察',
          content: '能源数据分析的详细指南...',
          tags: ['能源', '分析', '数据'],
          readTime: 12,
          helpful: 41,
          notHelpful: 2,
          lastUpdated: '2024-01-12'
        }
      ],
      faqs: [
        {
          id: 1,
          question: '如何重置密码？',
          answer: '您可以在登录页面点击"忘记密码"链接，输入您的邮箱地址，系统会发送重置密码的邮件到您的邮箱。',
          category: '账户管理',
          helpful: 45
        },
        {
          id: 2,
          question: '设备离线怎么办？',
          answer: '首先检查设备的网络连接，确保设备能够正常连接到互联网。如果网络正常，请检查设备的电源状态和MQTT配置。',
          category: '设备问题',
          helpful: 38
        },
        {
          id: 3,
          question: '数据更新频率是多少？',
          answer: '系统默认每5分钟更新一次数据。您可以在设备设置中调整数据采集频率，支持1分钟到1小时的范围。',
          category: '数据相关',
          helpful: 29
        },
        {
          id: 4,
          question: '如何导出报告？',
          answer: '在报告页面，选择您需要的报告类型和时间范围，点击"导出"按钮，选择导出格式（PDF、Excel等），系统会生成并下载报告文件。',
          category: '报告功能',
          helpful: 52
        },
        {
          id: 5,
          question: '支持哪些设备类型？',
          answer: '系统支持各种智能电表、传感器、空调系统、照明设备等。具体支持的设备型号请参考设备兼容性列表。',
          category: '设备兼容',
          helpful: 33
        }
      ],
      videos: [
        {
          id: 1,
          title: '系统概览和快速入门',
          description: '5分钟了解系统的主要功能和基本操作',
          duration: '5:23',
          thumbnail: '/api/placeholder/320/180',
          category: '入门教程',
          views: 1250
        },
        {
          id: 2,
          title: '设备添加和配置',
          description: '详细演示如何添加新设备并进行基本配置',
          duration: '8:45',
          thumbnail: '/api/placeholder/320/180',
          category: '设备管理',
          views: 890
        },
        {
          id: 3,
          title: '能源数据分析技巧',
          description: '学习如何有效分析能源数据并发现节能机会',
          duration: '12:30',
          thumbnail: '/api/placeholder/320/180',
          category: '数据分析',
          views: 675
        },
        {
          id: 4,
          title: '报告生成和定制',
          description: '掌握各种报告的生成方法和个性化定制',
          duration: '7:15',
          thumbnail: '/api/placeholder/320/180',
          category: '报告功能',
          views: 543
        }
      ],
      downloads: [
        {
          id: 1,
          name: '用户操作手册',
          description: '完整的系统操作指南，包含所有功能的详细说明',
          type: 'PDF',
          size: '2.5MB',
          version: 'v1.0',
          downloads: 1250,
          lastUpdated: '2024-01-15'
        },
        {
          id: 2,
          name: '设备兼容性列表',
          description: '支持的设备型号和配置要求清单',
          type: 'Excel',
          size: '156KB',
          version: 'v1.2',
          downloads: 890,
          lastUpdated: '2024-01-10'
        },
        {
          id: 3,
          name: 'API开发文档',
          description: '系统API接口文档，适用于开发人员集成',
          type: 'PDF',
          size: '1.8MB',
          version: 'v1.1',
          downloads: 345,
          lastUpdated: '2024-01-08'
        },
        {
          id: 4,
          name: '快速参考卡片',
          description: '常用功能和快捷键的快速参考指南',
          type: 'PDF',
          size: '512KB',
          version: 'v1.0',
          downloads: 678,
          lastUpdated: '2024-01-05'
        }
      ]
    };
    setHelpData(data);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    // 实现搜索逻辑
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setSelectedArticle(null);
  };

  const handleArticleSelect = (article) => {
    setSelectedArticle(article);
  };

  const handleFeedbackSubmit = () => {
    console.log('提交反馈:', feedback);
    setFeedbackDialogOpen(false);
    setFeedback({
      type: 'suggestion',
      title: '',
      description: '',
      rating: 5
    });
  };

  const renderSearchAndNavigation = () => (
    <Box sx={{ mb: 3 }}>
      <TextField
        fullWidth
        placeholder="搜索帮助内容..."
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          )
        }}
        sx={{ mb: 2 }}
      />
      
      {selectedCategory && (
        <Breadcrumbs separator={<NavigateNext fontSize="small" />}>
          <Link 
            component="button" 
            variant="body1" 
            onClick={() => setSelectedCategory(null)}
          >
            帮助中心
          </Link>
          <Link 
            component="button" 
            variant="body1" 
            onClick={() => setSelectedArticle(null)}
          >
            {selectedCategory.name}
          </Link>
          {selectedArticle && (
            <Typography color="text.primary">
              {selectedArticle.title}
            </Typography>
          )}
        </Breadcrumbs>
      )}
    </Box>
  );

  const renderCategories = () => (
    <Grid container spacing={3}>
      {helpData.categories.map((category) => (
        <Grid item xs={12} sm={6} md={4} key={category.id}>
          <Card 
            sx={{ 
              cursor: 'pointer',
              '&:hover': { 
                boxShadow: 4,
                transform: 'translateY(-2px)'
              },
              transition: 'all 0.2s'
            }}
            onClick={() => handleCategorySelect(category)}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <School color="primary" sx={{ mr: 2 }} />
                <Typography variant="h6">
                  {category.name}
                </Typography>
              </Box>
              <Typography variant="body2" color="textSecondary" paragraph>
                {category.description}
              </Typography>
              <Chip 
                label={`${category.articleCount} 篇文章`}
                size="small"
                color="primary"
                variant="outlined"
              />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const renderArticles = () => {
    const articles = selectedCategory 
      ? helpData.articles.filter(a => a.categoryId === selectedCategory.id)
      : helpData.articles;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {selectedArticle ? (
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h5" gutterBottom>
                    {selectedArticle.title}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton size="small">
                      <Print />
                    </IconButton>
                    <IconButton size="small">
                      <Share />
                    </IconButton>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  {selectedArticle.tags.map((tag) => (
                    <Chip key={tag} label={tag} size="small" variant="outlined" />
                  ))}
                </Box>
                
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  阅读时间: {selectedArticle.readTime} 分钟 | 最后更新: {selectedArticle.lastUpdated}
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="body1" paragraph>
                  {selectedArticle.content}
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="textSecondary">
                    这篇文章对您有帮助吗？
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button 
                      size="small" 
                      startIcon={<ThumbUp />}
                      variant="outlined"
                    >
                      有帮助 ({selectedArticle.helpful})
                    </Button>
                    <Button 
                      size="small" 
                      startIcon={<ThumbDown />}
                      variant="outlined"
                    >
                      没帮助 ({selectedArticle.notHelpful})
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ) : (
            <List>
              {articles.map((article) => (
                <Card key={article.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <ListItem 
                      button 
                      onClick={() => handleArticleSelect(article)}
                      sx={{ p: 0 }}
                    >
                      <ListItemIcon>
                        <Article color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={article.title}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="textSecondary">
                              {article.summary}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                              {article.tags.map((tag) => (
                                <Chip key={tag} label={tag} size="small" variant="outlined" />
                              ))}
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                  </CardContent>
                </Card>
              ))}
            </List>
          )}
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                需要更多帮助？
              </Typography>
              <List>
                <ListItem button>
                  <ListItemIcon>
                    <Chat color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="在线客服"
                    secondary="工作日 9:00-18:00"
                  />
                </ListItem>
                <ListItem button>
                  <ListItemIcon>
                    <Email color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="邮件支持"
                    secondary="support@company.com"
                  />
                </ListItem>
                <ListItem button>
                  <ListItemIcon>
                    <Phone color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="电话支持"
                    secondary="400-123-4567"
                  />
                </ListItem>
              </List>
              
              <Button 
                fullWidth 
                variant="outlined" 
                startIcon={<Feedback />}
                onClick={() => setFeedbackDialogOpen(true)}
                sx={{ mt: 2 }}
              >
                提交反馈
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderFAQs = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        {helpData.faqs.map((faq) => (
          <Accordion key={faq.id}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <QuestionAnswer color="primary" sx={{ mr: 2 }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle1">
                    {faq.question}
                  </Typography>
                  <Chip 
                    label={faq.category}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ mt: 0.5 }}
                  />
                </Box>
                <Typography variant="body2" color="textSecondary">
                  {faq.helpful} 人觉得有用
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1">
                {faq.answer}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button size="small" startIcon={<ThumbUp />}>
                  有帮助
                </Button>
                <Button size="small" startIcon={<ThumbDown />}>
                  没帮助
                </Button>
              </Box>
            </AccordionDetails>
          </Accordion>
        ))}
      </Grid>
    </Grid>
  );

  const renderVideos = () => (
    <Grid container spacing={3}>
      {helpData.videos.map((video) => (
        <Grid item xs={12} sm={6} md={4} key={video.id}>
          <Card>
            <Box sx={{ position: 'relative' }}>
              <Box 
                sx={{ 
                  width: '100%', 
                  height: 180, 
                  backgroundColor: 'grey.200',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <PlayCircle sx={{ fontSize: 60, color: 'primary.main' }} />
              </Box>
              <Chip 
                label={video.duration}
                size="small"
                sx={{ 
                  position: 'absolute', 
                  bottom: 8, 
                  right: 8,
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  color: 'white'
                }}
              />
            </Box>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {video.title}
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                {video.description}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Chip 
                  label={video.category}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
                <Typography variant="caption" color="textSecondary">
                  {video.views} 次观看
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const renderDownloads = () => (
    <Grid container spacing={3}>
      {helpData.downloads.map((download) => (
        <Grid item xs={12} md={6} key={download.id}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                <GetApp color="primary" sx={{ mr: 2, mt: 0.5 }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {download.name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    {download.description}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip label={download.type} size="small" color="primary" />
                    <Chip label={download.size} size="small" variant="outlined" />
                    <Chip label={download.version} size="small" variant="outlined" />
                  </Box>
                  <Typography variant="caption" color="textSecondary">
                    {download.downloads} 次下载 | 更新于 {download.lastUpdated}
                  </Typography>
                </Box>
              </Box>
              <Button 
                variant="contained" 
                startIcon={<Download />}
                fullWidth
              >
                下载
              </Button>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          帮助中心
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ContactSupport />}
          onClick={() => setFeedbackDialogOpen(true)}
        >
          联系支持
        </Button>
      </Box>

      {renderSearchAndNavigation()}

      {!selectedCategory ? (
        <>
          <Paper sx={{ width: '100%', mb: 2 }}>
            <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
              <Tab icon={<MenuBook />} label="用户手册" />
              <Tab icon={<QuestionAnswer />} label="常见问题" />
              <Tab icon={<VideoLibrary />} label="视频教程" />
              <Tab icon={<Download />} label="资料下载" />
            </Tabs>
          </Paper>

          {tabValue === 0 && renderCategories()}
          {tabValue === 1 && renderFAQs()}
          {tabValue === 2 && renderVideos()}
          {tabValue === 3 && renderDownloads()}
        </>
      ) : (
        renderArticles()
      )}

      {/* 反馈对话框 */}
      <Dialog 
        open={feedbackDialogOpen} 
        onClose={() => setFeedbackDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            提交反馈
            <IconButton onClick={() => setFeedbackDialogOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                反馈类型
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip 
                  label="建议"
                  color={feedback.type === 'suggestion' ? 'primary' : 'default'}
                  onClick={() => setFeedback({ ...feedback, type: 'suggestion' })}
                  icon={<Lightbulb />}
                />
                <Chip 
                  label="问题报告"
                  color={feedback.type === 'bug' ? 'primary' : 'default'}
                  onClick={() => setFeedback({ ...feedback, type: 'bug' })}
                  icon={<BugReport />}
                />
                <Chip 
                  label="功能请求"
                  color={feedback.type === 'feature' ? 'primary' : 'default'}
                  onClick={() => setFeedback({ ...feedback, type: 'feature' })}
                  icon={<Star />}
                />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="标题"
                value={feedback.title}
                onChange={(e) => setFeedback({ ...feedback, title: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="详细描述"
                multiline
                rows={4}
                value={feedback.description}
                onChange={(e) => setFeedback({ ...feedback, description: e.target.value })}
                placeholder="请详细描述您的问题或建议..."
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                整体评分
              </Typography>
              <Rating
                value={feedback.rating}
                onChange={(e, value) => setFeedback({ ...feedback, rating: value })}
                size="large"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFeedbackDialogOpen(false)}>
            取消
          </Button>
          <Button 
            onClick={handleFeedbackSubmit}
            variant="contained"
            disabled={!feedback.title || !feedback.description}
          >
            提交反馈
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HelpCenter;