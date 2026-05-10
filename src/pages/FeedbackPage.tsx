import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { MessageSquare, Send, CheckCircle } from 'lucide-react';
import { message, Spin } from 'antd';
import { authUtils, submitFeedback, getMyFeedbacks } from '../api';
import type { Feedback, FeedbackType as ApiFeedbackType, FeedbackStatus } from '../api/types';

const FEEDBACK_TYPES = ['功能建议', '问题反馈', '内容举报', '其他'] as const;
type FeedbackLabel = typeof FEEDBACK_TYPES[number];

const TYPE_MAP: Record<FeedbackLabel, ApiFeedbackType> = {
  功能建议: 'feature',
  问题反馈: 'bug',
  内容举报: 'report',
  其他: 'other',
};

const TYPE_LABELS: Record<ApiFeedbackType, string> = {
  feature: '功能建议',
  bug: '问题反馈',
  report: '内容举报',
  other: '其他',
};

const STATUS_LABELS: Record<FeedbackStatus, string> = {
  pending: '待处理',
  reviewed: '已查看',
  resolved: '已解决',
};

const STATUS_STYLE: Record<FeedbackStatus, { color: string; bg: string; border: string }> = {
  pending: { color: '#ffb347', bg: 'rgba(255,179,71,0.12)', border: 'rgba(255,179,71,0.25)' },
  reviewed: { color: '#8ff5ff', bg: 'rgba(143,245,255,0.1)', border: 'rgba(143,245,255,0.22)' },
  resolved: { color: '#aaffdc', bg: 'rgba(170,255,220,0.1)', border: 'rgba(170,255,220,0.22)' },
};

const PRIMARY = '#8ff5ff';

export default function FeedbackPage() {
  const navigate = useNavigate();
  const [feedbackType, setFeedbackType] = useState<FeedbackLabel>('功能建议');
  const [feedbackText, setFeedbackText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [myList, setMyList] = useState<Feedback[]>([]);
  const [myListLoading, setMyListLoading] = useState(false);
  const isAuthed = authUtils.isAuthenticated();

  const refreshMyFeedbacks = useCallback(async () => {
    if (!authUtils.isAuthenticated()) return;
    setMyListLoading(true);
    try {
      const res = await getMyFeedbacks({ page: 1, limit: 50 });
      setMyList(res.data.list);
    } catch {
      setMyList([]);
    } finally {
      setMyListLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshMyFeedbacks();
  }, [refreshMyFeedbacks]);

  const handleSubmit = async () => {
    if (!feedbackText.trim()) {
      message.warning('请填写反馈内容');
      return;
    }
    setSubmitting(true);
    try {
      await submitFeedback({ type: TYPE_MAP[feedbackType], description: feedbackText.trim() });
      setSubmitted(true);
      void refreshMyFeedbacks();
    } catch {
      message.error('提交失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAgain = () => {
    setFeedbackText('');
    setFeedbackType('功能建议');
    setSubmitted(false);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0e0e0f' }}>
      <div className="max-w-lg mx-auto px-4 pt-8 pb-24">

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 mb-8 text-sm font-medium transition-colors"
          style={{ color: '#6e6e73' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#c4c4c8'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#6e6e73'; }}
        >
          <ChevronLeftIcon className="h-4 w-4" />
          返回
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div style={{
            width: '2.75rem', height: '2.75rem', borderRadius: '0.875rem', flexShrink: 0,
            background: 'linear-gradient(135deg, rgba(143,245,255,0.15), rgba(91,200,212,0.08))',
            border: '1px solid rgba(143,245,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <MessageSquare style={{ width: '1.125rem', height: '1.125rem', color: '#8ff5ff' }} strokeWidth={2} />
          </div>
          <div>
            <h1 style={{ color: '#e0e0e3', fontWeight: 700, fontSize: '1.25rem', lineHeight: 1.3 }}>意见反馈</h1>
            <p style={{ color: '#6e6e73', fontSize: '0.8125rem', marginTop: '0.125rem' }}>您的反馈对我们至关重要，请告诉我们您的想法</p>
          </div>
        </div>

        {submitted ? (
          /* Success state */
          <div
            className="rounded-2xl p-10 flex flex-col items-center text-center"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div style={{
              width: '3.5rem', height: '3.5rem', borderRadius: '50%', marginBottom: '1.25rem',
              background: 'linear-gradient(135deg, rgba(143,245,255,0.15), rgba(91,200,212,0.08))',
              border: '1px solid rgba(143,245,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CheckCircle style={{ width: '1.5rem', height: '1.5rem', color: '#8ff5ff' }} strokeWidth={2} />
            </div>
            <div style={{ color: '#e0e0e3', fontWeight: 700, fontSize: '1.0625rem', marginBottom: '0.5rem' }}>
              感谢你的反馈！
            </div>
            <div style={{ color: '#6e6e73', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              我们已收到你的意见，会持续改进产品体验。
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleAgain}
                style={{
                  padding: '0.625rem 1.25rem', borderRadius: '0.75rem', cursor: 'pointer',
                  backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                  color: '#c4c4c8', fontWeight: 600, fontSize: '0.9rem',
                }}
              >
                再提一条
              </button>
              <button
                onClick={() => navigate(-1)}
                style={{
                  padding: '0.625rem 1.25rem', borderRadius: '0.75rem', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #8ff5ff, #5bc8d4)',
                  border: 'none', color: '#0e0e0f', fontWeight: 700, fontSize: '0.9rem',
                }}
              >
                返回首页
              </button>
            </div>
          </div>
        ) : (
          /* Form */
          <div className="space-y-5">

            {/* Type selector */}
            <div
              className="rounded-2xl p-5"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div style={{ color: '#6e6e73', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', marginBottom: '0.875rem' }}>
                反馈类型
              </div>
              <div className="flex flex-wrap gap-2">
                {FEEDBACK_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => setFeedbackType(type)}
                    style={{
                      padding: '0.4375rem 1rem', borderRadius: '0.625rem', cursor: 'pointer',
                      fontSize: '0.875rem', fontWeight: 500, transition: 'all 0.15s',
                      ...(feedbackType === type
                        ? {
                            background: 'rgba(143,245,255,0.1)',
                            border: '1px solid rgba(143,245,255,0.3)',
                            color: '#8ff5ff',
                          }
                        : {
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: '#6e6e73',
                          }),
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Text area */}
            <div
              className="rounded-2xl p-5"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div style={{ color: '#6e6e73', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', marginBottom: '0.875rem' }}>
                详细描述
              </div>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value.slice(0, 300))}
                placeholder="描述你的想法，或遇到的问题…"
                rows={6}
                style={{
                  width: '100%', resize: 'none', outline: 'none',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '0.75rem', padding: '0.875rem 1rem',
                  color: '#e0e0e3', fontSize: '1rem', lineHeight: 1.6,
                  fontFamily: 'inherit',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(143,245,255,0.3)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
              />
              <div style={{ color: '#6e6e73', fontSize: '0.75rem', textAlign: 'right', marginTop: '0.5rem' }}>
                {feedbackText.length} / 300
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2"
              style={{
                padding: '0.875rem', borderRadius: '0.875rem', cursor: submitting ? 'not-allowed' : 'pointer',
                background: submitting ? 'rgba(143,245,255,0.3)' : 'linear-gradient(135deg, #8ff5ff, #5bc8d4)',
                border: 'none', color: '#0e0e0f', fontWeight: 700, fontSize: '0.9375rem',
                transition: 'opacity 0.15s',
                opacity: submitting ? 0.7 : 1,
              }}
            >
              <Send style={{ width: '1rem', height: '1rem' }} strokeWidth={2.5} />
              {submitting ? '提交中…' : '提交反馈'}
            </button>
          </div>
        )}

        {/* 我的反馈列表 */}
        <section className="mt-12">
          <div
            style={{ color: '#6e6e73', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', marginBottom: '0.875rem' }}
          >
            我的反馈
          </div>
          {!isAuthed ? (
            <div
              className="rounded-2xl p-5 text-center"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <p style={{ color: '#8e8e93', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1rem' }}>
                登录后可在此查看已提交的反馈及官方回复。
              </p>
              <button
                type="button"
                onClick={() => navigate('/login')}
                style={{
                  padding: '0.5rem 1rem', borderRadius: '0.625rem', cursor: 'pointer',
                  background: 'rgba(143,245,255,0.1)', border: `1px solid ${PRIMARY}33`,
                  color: PRIMARY, fontWeight: 600, fontSize: '0.875rem',
                }}
              >
                去登录
              </button>
            </div>
          ) : myListLoading && myList.length === 0 ? (
            <div className="flex justify-center py-14">
              <Spin />
            </div>
          ) : myList.length === 0 ? (
            <div
              className="rounded-2xl p-8 text-center"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <span style={{ color: '#6e6e73', fontSize: '0.875rem' }}>暂无反馈记录</span>
            </div>
          ) : (
            <Spin spinning={myListLoading}>
              <div className="space-y-3">
                {myList.map((item) => {
                  const st = STATUS_STYLE[item.status];
                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl p-4"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span
                          style={{
                            display: 'inline-block', fontSize: '0.72rem', fontWeight: 600, padding: '2px 10px',
                            borderRadius: 999, color: PRIMARY, whiteSpace: 'nowrap',
                            backgroundColor: `${PRIMARY}14`, border: `1px solid ${PRIMARY}22`,
                          }}
                        >
                          {TYPE_LABELS[item.type]}
                        </span>
                        <span
                          style={{
                            display: 'inline-block', fontSize: '0.72rem', fontWeight: 600, padding: '2px 10px',
                            borderRadius: 999, color: st.color, whiteSpace: 'nowrap',
                            backgroundColor: st.bg, border: `1px solid ${st.border}`,
                          }}
                        >
                          {STATUS_LABELS[item.status]}
                        </span>
                        <span style={{ color: '#6e6e73', fontSize: '0.75rem', marginLeft: 'auto' }}>
                          {new Date(item.created_at).toLocaleString('zh-CN', {
                            year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p style={{ color: '#e0e0e3', fontSize: '0.875rem', lineHeight: 1.55, margin: 0 }}>
                        {item.description}
                      </p>
                      {item.admin_reply ? (
                        <div
                          className="mt-3 pt-3"
                          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                        >
                          <div style={{ color: '#6e6e73', fontSize: '0.7rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                            官方回复
                          </div>
                          <p style={{ color: '#c4c4c8', fontSize: '0.8125rem', lineHeight: 1.55, margin: 0 }}>
                            {item.admin_reply}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </Spin>
          )}
        </section>
      </div>
    </div>
  );
}
