---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 확산 과정, 브라운 운동, 랑주뱅 방정식, 확률적 미분방정식, 디노이징 확산 모델, 스코어 매칭, 노이즈 스케줄, 역방향 SDE
keywords_en: diffusion process, Brownian motion, Langevin equation, stochastic differential equation, denoising diffusion model, score matching, noise schedule, reverse-time SDE
---
Diffusion Process - 브라운 운동의 물리학이 현대 이미지 생성 AI의 수학적 뼈대가 된 과정

## 확산의 물리적 원리

1827년 식물학자 Robert Brown은 물 위에 떠 있는 꽃가루 입자가 아무런 외력 없이 불규칙하게 떨리는 것을 관찰했다. 원인은 78년 뒤 Albert Einstein(1905)이 밝혔다. 꽃가루 입자 주위의 물 분자 수십억 개가 매초 충돌하며, 한쪽에서 더 세게 치는 순간마다 입자가 밀린다. 한 번의 충돌은 무시할 만큼 작지만, 그 충돌의 누적이 현미경으로 볼 수 있는 수준의 무작위 운동을 만든다.

핵심 정량적 결과는 이것이다. 시간 t가 지난 후 입자의 평균 제곱 변위는 시간에 비례한다. 이 비례 상수가 확산 계수 D이며, 온도가 높을수록, 유체의 점성이 낮을수록 D가 커진다. 공간적으로 상상하면, 잉크 한 방울을 물에 떨어뜨렸을 때 잉크가 서서히 퍼져 균일해지는 과정이 바로 확산이다.

## 개별 입자에서 확률 분포로

Einstein의 확산 방정식은 입자 **집단**의 농도 변화를 기술한다. Paul Langevin(1908)은 **개별 입자** 하나의 궤적을 기술하는 접근법을 제시했다. 현대적 표기로 일반화하면 확률적 미분방정식(SDE)이 된다.

dx = f(x, t)dt + g(t)dW

f(x, t)dt는 **드리프트**(drift) 항으로, 외부 힘이 입자를 특정 방향으로 밀어내는 결정론적 성분이다. g(t)dW는 **확산**(diffusion) 항으로, 분자 충돌로 인한 무작위 떨림이다. dW는 위너 과정(Wiener process)의 증분으로, 독립적이고 정규분포를 따르는 무한소 랜덤 충격이다. g(t)가 0이면 결정론적 상미분방정식, f가 0이면 순수 랜덤 워크가 된다.

## 물리학에서 생성 모델로

이 물리학을 AI로 가져온 핵심 발상은 Sohl-Dickstein et al.(2015)에서 나왔다. 깨끗한 이미지에 아주 작은 가우시안 노이즈를 반복적으로 더하면, 충분한 단계 후에 원래 이미지의 구조가 완전히 사라지고 순수한 가우시안 노이즈만 남는다. 이 과정은 잉크가 물에 퍼져 균일해지는 확산과 수학적으로 동일하다. 그렇다면 이 확산을 **거꾸로 되돌리는** 방법을 학습할 수 있다면, 순수 노이즈에서 이미지를 만들어낼 수 있다.

이 아이디어의 수학적 근거는 Anderson(1982)이 이미 증명해 두었다. 전방 SDE가 있으면 대응하는 역방향 SDE가 존재하며, 데이터의 스코어 함수(score function) grad_x log p_t(x)만 알면 풀 수 있다. 핵심 대응 관계는 다음과 같다.

- 잉크 퍼짐(물리적 확산) --> **이미지에 노이즈 추가** (전방 과정)
- 확산 계수 D --> **노이즈 스케줄 beta_t** (각 단계에서 얼마나 노이즈를 넣는가)
- 열역학적 평형(균일 분포) --> **순수 가우시안 노이즈** (전방 과정의 종착점)
- Langevin 방정식의 드리프트 항 --> **신경망이 학습하는 디노이징 방향**

## 전방 과정과 역방향 과정: 핵심 메커니즘

**전방 과정**(forward process)은 설계자가 정의한다. 학습이 필요 없다. 시간 단계 t에서 이전 데이터에 가우시안 노이즈를 더하되, sqrt(1 - beta_t)를 곱해 분산 폭발을 방지한다. beta_t는 노이즈의 크기를 결정하는 **노이즈 스케줄**로, 보통 0.0001에서 0.02 정도로 서서히 증가시킨다. T = 1000 단계를 거치면 어떤 이미지로 시작하든 거의 동일한 가우시안 노이즈가 된다.

**역방향 과정**(reverse process)은 신경망이 학습하는 부분이다. 노이즈가 섞인 x_t와 시간 단계 t를 받아, 한 단계 깨끗한 x_{t-1}의 평균을 예측한다. 이것을 T = 1000에서 t = 0까지 반복 적용하면, 순수 노이즈에서 출발하여 깨끗한 이미지에 도착한다. 물리적 확산에서 잉크가 퍼지는 건 자연스럽지만, 퍼진 잉크가 다시 한 점으로 모이는 것은 열역학 제2법칙에 의해 불가능하다. 이 "불가능한 역방향"을 가능하게 만드는 것이 신경망의 학습이다.

## DDPM의 핵심 돌파구

Ho, Jain, Abbeel(2020)의 DDPM(Denoising Diffusion Probabilistic Model)이 결정적 돌파구를 만들었다. 핵심은 **예측 대상을 바꾼 것**이다. 신경망이 디노이징된 평균을 직접 예측하는 대신, 각 단계에서 **추가된 노이즈 자체**를 예측한다. 손실 함수도 극적으로 단순해졌다.

L = E[||epsilon - epsilon_theta(x_t, t)||^2]

실제 추가된 노이즈와 신경망이 예측한 노이즈의 평균 제곱 오차다. Song et al.(2021)은 이산적 시간 단계의 확산을 연속적 SDE로 통합하여, **노이즈를 예측하여 제거하는 것이 스코어를 추정하는 것과 수학적으로 동등**함을 보였다. DDPM이 "여기에 어떤 노이즈가 끼었는가"를 맞추는 것과, 스코어 모델이 "여기서 데이터가 가장 많은 방향은 어디인가"를 맞추는 것은 같은 문제다.

## 현대 AI 기법과의 연결

확산 과정의 물리학은 현대 생성 AI의 지배적 패러다임이 되었다.

**같은 물리적 원리의 직접 적용:**

- **DALL-E 2, Stable Diffusion, Midjourney**: 모두 확산 과정을 핵심 생성 메커니즘으로 사용한다. Stable Diffusion(Rombach et al. 2022)의 핵심 혁신은 **잠재 공간 확산**(latent diffusion)이다. 고차원 픽셀 공간 대신 오토인코더로 압축한 저차원 잠재 공간에서 확산을 수행하여 계산 비용을 대폭 줄였다.
- **텍스트-이미지 조건부 생성**: 역방향 과정의 드리프트를 텍스트 임베딩으로 조건화하여 구현한다. Classifier-free guidance(Ho & Salimans 2022)는 조건부 스코어와 무조건부 스코어를 선형 결합하여 생성 품질과 텍스트 정합성을 조절한다.
- **비디오, 오디오, 3D 생성**: 동일한 확산 프레임워크가 비디오(Sora), 오디오(AudioLDM), 3D(DreamFusion)로 확장되었다. 데이터의 종류가 바뀌어도 "노이즈 추가 후 역방향 복원"이라는 핵심 구조는 동일하다.

**동일한 직관을 독립적으로 공유하는 구조적 유사성:**

- **VAE의 잠재 공간 샘플링**: VAE도 노이즈에서 데이터를 생성하지만, 단일 잠재 변수에서 한 번에 디코딩한다. 확산 모델은 수백 단계에 걸쳐 점진적으로 노이즈를 제거한다. "노이즈에서 출발"이라는 직관은 공유하지만 생성 메커니즘은 근본적으로 다르다.
- **GAN의 노이즈-to-이미지**: GAN도 랜덤 노이즈에서 이미지를 생성하지만, 게임 이론의 적대적 학습(Goodfellow 2014)에서 유래했다. 확산 모델과의 유사성은 입출력 구조의 우연한 일치다.

## 한계와 약점

- **느린 샘플링 속도**: 물리적 확산의 역방향을 시뮬레이션하므로 수십~수백 단계의 순차적 반복이 필요하다. GAN은 한 번의 전방 패스로 이미지를 생성하지만, 확산 모델은 T = 1000 단계를 밟는 것이 원래 설계다. DDIM(Song et al. 2021)이 50단계로, Consistency Models(Song et al. 2023)가 1~2단계로 줄이는 시도를 하지만 품질 손실이 수반된다.
- **고노이즈 단계의 학습 불안정**: 거의 순수 노이즈 영역에서의 디노이징은 본질적으로 어렵다. 이 단계가 이미지의 전체 구조를 결정하기 때문에, 여기서의 오류가 이후 모든 단계에 전파된다.
- **이론과 실제의 괴리**: 역방향 SDE의 정확한 시뮬레이션은 무한히 작은 시간 단계와 완벽한 스코어 추정을 전제한다. 실제로는 이산화 오차와 근사 오차가 누적된다.
- **열역학과의 근본적 괴리**: 실제 확산은 열역학 제2법칙에 의해 비가역적이다. 역방향 확산을 가능하게 하는 것은 물리 법칙이 아닌 신경망의 학습이며, 이 점에서 물리학적 비유의 한계가 명확하다.

## 용어 정리

브라운 운동(Brownian motion) - 유체 속 미세 입자가 주변 분자의 충돌로 보이는 불규칙 운동. Einstein(1905)이 분자 운동론으로 설명

확률적 미분방정식(stochastic differential equation, SDE) - 결정론적 드리프트 항과 확률적 확산 항을 동시에 포함하는 미분방정식

위너 과정(Wiener process) - 브라운 운동의 수학적 이상화. 독립적이며 정규분포를 따르는 증분을 가지고, 경로가 연속이지만 어디서도 미분 불가능한 확률 과정

드리프트(drift) - SDE에서 외부 힘에 의한 결정론적 이동 성분

노이즈 스케줄(noise schedule) - 전방 확산 과정에서 각 시간 단계 t마다 추가되는 노이즈의 크기 beta_t를 정하는 함수

스코어 함수(score function) - 로그 확률 밀도의 그래디언트 grad_x log p(x). 데이터 분포에서 확률이 가장 빠르게 증가하는 방향을 가리킨다

잠재 공간 확산(latent diffusion) - 고차원 픽셀 공간 대신 오토인코더로 압축한 저차원 잠재 공간에서 확산을 수행하는 방법. Stable Diffusion의 핵심 설계

Classifier-free guidance - 조건부 스코어와 무조건부 스코어를 선형 결합하여 생성의 텍스트 정합성과 다양성을 조절하는 기법

---EN---
Diffusion Process - How the physics of Brownian motion became the mathematical backbone of modern image-generating AI

## The Physics of Diffusion

In 1827, botanist Robert Brown observed pollen particles floating on water jittering erratically with no external force. The cause was revealed 78 years later by Albert Einstein (1905). Billions of water molecules surrounding each pollen particle collide with it every second, and whenever one side strikes harder, the particle gets pushed. A single collision is negligibly small, but the accumulation produces random motion visible under a microscope.

The key quantitative result: the mean squared displacement of a particle after time t is proportional to t. The proportionality constant is the diffusion coefficient D, which increases with temperature and decreases with fluid viscosity. Spatially, imagine dropping ink into water -- the ink gradually spreads until uniformly distributed. That spreading is diffusion.

## From Individual Particles to Probability Distributions

Einstein's diffusion equation describes how the concentration of a **population** of particles changes. Paul Langevin (1908) took a different approach: describing the trajectory of a **single** particle. In modern notation, this generalizes to a Stochastic Differential Equation (SDE):

dx = f(x, t)dt + g(t)dW

f(x, t)dt is the **drift** term -- the deterministic component from external forces. g(t)dW is the **diffusion** term -- random jittering from molecular collisions, where dW is the increment of a Wiener process: independent, normally distributed infinitesimal random shocks. When g(t) = 0, it reduces to a deterministic ODE; when f = 0, it becomes a pure random walk.

## From Physics to Generative Model

The key idea that brought this physics into AI came from Sohl-Dickstein et al. (2015). If you repeatedly add tiny amounts of Gaussian noise to a clean image, after enough steps the original structure vanishes entirely, leaving only pure Gaussian noise. This is mathematically identical to ink diffusing in water. If this diffusion could be **learned in reverse**, images could be created from pure noise.

The mathematical foundation already existed. Anderson (1982) had proven that for any forward SDE, there exists a corresponding reverse-time SDE, solvable if one knows the score function -- the gradient of the log probability density, grad_x log p_t(x). The key correspondences are:

- Ink spreading (physical diffusion) --> **adding noise to an image** (forward process)
- Diffusion coefficient D --> **noise schedule beta_t** (how much noise per step)
- Thermodynamic equilibrium --> **pure Gaussian noise** (forward process endpoint)
- Drift term in the Langevin equation --> **denoising direction learned by the neural network**

## Forward and Reverse Process: Core Mechanism

The **forward process** is defined by the designer -- no learning required. At each time step t, Gaussian noise is added to previous data, multiplied by sqrt(1 - beta_t) to prevent variance explosion. The noise schedule beta_t typically increases slowly from 0.0001 to about 0.02. After T = 1000 steps, any starting image becomes nearly identical Gaussian noise.

The **reverse process** is what the neural network learns. Given noisy x_t and time step t, it predicts the mean of the one-step-cleaner x_{t-1}. Applied iteratively from T = 1000 down to t = 0, it produces a clean image from pure noise. In physical diffusion, ink spreading is natural, but ink spontaneously gathering back into a single drop violates the second law of thermodynamics. What makes this "impossible reverse" possible is neural network learning.

## DDPM's Key Breakthrough

Ho, Jain, and Abbeel's (2020) DDPM achieved the decisive breakthrough by **changing the prediction target**. Instead of predicting the denoised mean directly, the network predicts the **noise itself** added at each step. The loss function simplifies dramatically:

L = E[||epsilon - epsilon_theta(x_t, t)||^2]

The mean squared error between actual and predicted noise. Song et al. (2021) unified discrete-time diffusion into a continuous SDE framework, showing that **predicting and removing noise is mathematically equivalent to estimating the score**. DDPM asking "what noise was added here?" and a score model asking "which direction has the most data?" differ only by sign and scaling.

## Connections to Modern AI

The physics of diffusion has become the dominant paradigm in modern generative AI.

**Direct application of the same physical principle:**

- **DALL-E 2, Stable Diffusion, Midjourney**: All use diffusion as their core generation mechanism. Stable Diffusion's (Rombach et al. 2022) key innovation is **latent diffusion** -- performing diffusion in a low-dimensional latent space compressed by an autoencoder instead of high-dimensional pixel space, dramatically reducing computational cost.
- **Text-to-image conditional generation**: Implemented by conditioning the reverse process's drift on text embeddings. Classifier-free guidance (Ho & Salimans 2022) linearly combines conditional and unconditional scores to balance generation quality and text alignment.
- **Video, audio, and 3D generation**: The same diffusion framework extends to video (Sora), audio (AudioLDM), and 3D (DreamFusion). Though the data type changes, the core "add noise then reverse" structure remains identical.

**Structural similarities sharing the same intuition independently:**

- **VAE latent space sampling**: VAEs also generate data from noise, but decode from a single latent variable in one pass. Diffusion models remove noise gradually over hundreds of steps. They share the "start from noise" intuition but their mechanisms are fundamentally different.
- **GAN noise-to-image**: GANs also generate from random noise, but originate from game theory's adversarial training (Goodfellow 2014). The similarity is a coincidence of input-output structure.

## Limitations and Weaknesses

- **Slow sampling speed**: Simulating the reverse of physical diffusion requires tens to hundreds of sequential steps. GANs generate in a single forward pass, while diffusion models originally require T = 1000 steps. DDIM (Song et al. 2021) reduces this to 50 steps and Consistency Models (Song et al. 2023) to 1-2 steps, but with quality loss.
- **Training instability at high noise levels**: Denoising near-pure noise is inherently difficult. Since this stage determines global structure, errors here propagate through all subsequent steps.
- **Gap between theory and practice**: Exact simulation of the reverse SDE assumes infinitesimally small time steps and perfect score estimation. In reality, discretization and approximation errors accumulate.
- **Fundamental divergence from thermodynamics**: Real diffusion is irreversible under the second law. What makes reverse diffusion possible is neural network learning, not physical law -- a point where the physics analogy clearly breaks down.

## Glossary

Brownian motion - the irregular motion of microscopic particles in fluid caused by collisions with surrounding molecules. Einstein (1905) explained it through kinetic theory

Stochastic differential equation (SDE) - a differential equation containing both a deterministic drift term and a stochastic diffusion term

Wiener process - the mathematical idealization of Brownian motion. Has independent normally distributed increments and continuous but nowhere differentiable paths

Drift - the deterministic component in an SDE representing systematic movement from external forces

Noise schedule - a function beta_t determining the magnitude of noise added at each time step t of the forward diffusion process

Score function - the gradient of the log probability density, grad_x log p(x). Points in the direction of steepest probability increase

Latent diffusion - performing diffusion in a low-dimensional latent space compressed by an autoencoder instead of high-dimensional pixel space. The core design of Stable Diffusion

Classifier-free guidance - a technique linearly combining conditional and unconditional scores to balance text alignment and diversity in generation
