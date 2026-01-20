---
title: OIDC 认证流程笔记
date: 2026-01-20 19:06:00
updated: 2026-01-20 19:06:00
permalink: security/OIDC/OIDC/
tags:
  - 安全
  - OIDC
  - OAuth
---

state 用来校验：
「这是不是我发起的那个 OAuth 会话」

nonce 用来校验：
「这个 id_token 是否是为了登录这个 待完成登录会话 而签发的」

- 注册：先把name,redirect_uri,allowed_scopes,granted_type告诉oauth中心，中心把client_id,client_secret返回来。回调包括登录成功回调和logout回调。
- 登录
    - 前端构造oauth授权url，里面包含：client_id, redirect_uri, response_type(code换token)，scope（之前约定的allowed_scopes的子集），state（确保回调来自于这次请求），code_challenge（用于oauth中心校验下次回调的post带的code_verifier）。state存到redis里，key=state，value={redirect_uri,nonce,code_verifier}
    - oauth中心校验上述信息后跳转到设定的redirect_uri
        - 验证state对不对
        - code换token：id_token, access_token, refresh_token
        - id_token校验：确保是发给本系统的，验证signature, claims:iss,aud,exp,iat,nonce
        - 获取用户信息，通过access_token调用/oauth/userinfo，获得sub，email，name，phone，password等信息
        - 后台维护用户表，建立sub和userid的映射关系。
        - access token失效时用refresh token刷新
    - 创建session
        - 存储：user_id, user_data, 三大token
        - 删除：state
        - 设置cookie：存session id