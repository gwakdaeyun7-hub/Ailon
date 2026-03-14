---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 확산 과정, 브라운 운동, 랑주뱅 방정식, 확률적 미분방정식, 디노이징 확산 모델, 스코어 매칭, 생성 모델
keywords_en: diffusion process, Brownian motion, Langevin equation, stochastic differential equation, denoising diffusion model, score matching, generative model
---
Diffusion Process and Stochastic Differential Equations - 브라운 운동의 물리학에서 출발하여 현대 이미지 생성 AI의 수학적 핵심이 된 확산 과정

## 브라운 운동: 물리학의 출발점

1827년 식물학자 Robert Brown은 물 위 꽃가루 입자가 무작위로 떨리며 움직이는 현상을 관찰했다. 이 현상의 물리적 해명은 78년 후 Albert Einstein(1905)이 제공했다. 꽃가루 입자는 주변의 물 분자들과 끊임없이 충돌하며, 이 미세한 충돌들의 누적이 거시적으로 관찰 가능한 무작위 운동을 만든다.

Einstein은 이 과정을 수학적으로 기술했다. 시간 t 후 입자의 평균 제곱 변위는 시간에 비례한다. 이것은 확산 계수 D를 도입한 확산 방정식의 기초가 된다. 3년 후 Paul Langevin(1908)은 개별 입자의 운동을 확률적 미분방정식으로 기술하는 더 직접적인 접근법을 제시했다.

## 확률적 미분방정식의 수학

Langevin의 접근은 현대적 표기로 확률적 미분방정식(Stochastic Differential Equation, SDE)으로 일반화된다.

dx = f(x, t)dt + g(t)dW

여기서 f(x, t)는 드리프트 항(결정론적 힘), g(t)는 확산 계수(노이즈의 크기), dW는 위너 과정(Wiener process)의 증분이다. 위너 과정은 브라운 운동의 수학적 이상화로, 독립적이고 정규분포를 따르는 무한소 증분을 갖는다.

이 수식의 물리적 의미는 다음과 같다. 입자의 운동에는 두 가지 성분이 있다. 하나는 외부 힘에 의한 체계적 이동(**드리프트**)이고, 다른 하나는 분자 충돌에 의한 무작위 떨림(**확산**)이다. 확산이 지배적이면 입자는 무질서하게 퍼져나가고, 드리프트가 지배적이면 특정 방향으로 이동한다.

Fokker와 Planck은 개별 입자의 SDE 대신 확률 밀도 함수 p(x, t)의 시간 변화를 기술하는 편미분방정식을 유도했다. 이것이 Fokker-Planck 방정식이며, 확산 과정의 거시적 기술이다.

## 확산에서 생성으로: 핵심 아이디어

Sohl-Dickstein et al.(2015)은 물리학의 확산 과정에서 직접 영감을 받아 혁명적 발상을 했다. 데이터에 **점진적으로 노이즈를 추가하여 완전한 가우시안 노이즈로 만드는** 과정(전방 과정)은 물리학의 확산과 수학적으로 동일하다. 그렇다면 이 과정을 **역방향**으로 학습할 수 있다면, 순수 노이즈에서 데이터를 생성할 수 있지 않을까?

전방 과정(forward process)은 다음과 같이 정의된다.

q(x_t | x_{t-1}) = N(x_t; sqrt(1 - beta_t) * x_{t-1}, beta_t * I)

각 시간 단계에서 데이터에 약간의 가우시안 노이즈(분산 beta_t)를 추가한다. beta_t는 노이즈 스케줄로, 보통 시간에 따라 점차 커진다. 충분한 단계를 거치면 원래 데이터의 구조는 완전히 사라지고 등방적 가우시안 노이즈만 남는다.

역방향 과정(reverse process)은 신경망이 학습하는 부분이다.

p_theta(x_{t-1} | x_t) = N(x_{t-1}; mu_theta(x_t, t), sigma_t^2 * I)

신경망 mu_theta는 노이즈가 포함된 x_t를 받아 한 단계 디노이징된 x_{t-1}의 평균을 예측한다. 이 역방향 과정을 T부터 0까지 반복 적용하면, 순수 노이즈에서 데이터 분포의 샘플이 생성된다.

## DDPM: 실용적 돌파구

Ho, Jain, Abbeel(2020)의 DDPM(Denoising Diffusion Probabilistic Model)은 Sohl-Dickstein et al.의 아이디어를 실용적으로 구현한 결정적 논문이다. DDPM의 핵심 단순화는 **신경망의 학습 목표를 재정의**한 것이다. 평균을 직접 예측하는 대신, 각 시간 단계에서 **추가된 노이즈 자체**를 예측하도록 했다.

epsilon_theta(x_t, t) ≈ epsilon (원래 추가된 노이즈)

이 재매개변수화(reparameterization)는 학습을 극적으로 안정화시켰다. 손실 함수도 단순해져, 예측된 노이즈와 실제 노이즈 사이의 평균 제곱 오차가 된다.

L = E[||epsilon - epsilon_theta(x_t, t)||^2]

이 손실 함수가 변분 하한(variational lower bound)의 가중 버전과 동등하다는 것이 수학적으로 보여졌다.

## 스코어 기반 SDE 프레임워크

Song et al.(2021)은 이산적 시간 단계의 확산 과정을 연속적 SDE로 통합하여, DDPM과 스코어 매칭(score matching)이 동일한 프레임워크의 두 관점임을 보였다.

스코어 함수(score function)는 로그 확률 밀도의 그래디언트다.

s(x) = grad_x log p(x)

**스코어를 안다면 Langevin 역학을 통해 분포에서 샘플링**할 수 있다. 핵심 통찰은 **디노이징이 곧 스코어 추정**이라는 것이다. 노이즈를 예측하여 제거하는 것은, 데이터 분포의 가장 가파른 상승 방향(스코어)을 추정하는 것과 수학적으로 동등하다.

Anderson(1982)이 증명한 역방향 SDE는 다음과 같다.

dx = [f(x, t) - g(t)^2 * grad_x log p_t(x)]dt + g(t)dW_bar

전방 SDE의 드리프트에 스코어를 더한 항이 **역방향 드리프트**가 된다. 신경망이 스코어를 근사하면 이 역방향 SDE를 수치적으로 풀어 샘플을 생성한다.

## DALL-E, Stable Diffusion, Midjourney의 물리학적 뿌리

이 확산 프레임워크는 현대 이미지 생성 AI의 근간이다. DALL-E 2(Ramesh et al. 2022), Stable Diffusion(Rombach et al. 2022), Midjourney는 모두 확산 과정을 핵심 생성 메커니즘으로 사용한다.

Stable Diffusion의 핵심 혁신은 **잠재 공간 확산**(latent diffusion)이다. 픽셀 공간에서 직접 확산을 수행하는 대신, 오토인코더로 압축된 잠재 공간에서 확산을 수행하여 계산 비용을 대폭 줄였다. 물리학의 확산 원리는 보존하되, 공간만 바꾼 것이다.

텍스트-이미지 조건부 생성은 역방향 과정의 드리프트를 텍스트 임베딩으로 조건화하여 구현한다. Classifier-free guidance(Ho & Salimans 2022)는 조건부/무조건부 스코어를 선형 결합하여 생성 품질과 텍스트 정합성을 조절한다.

## 한계와 약점

확산 모델은 생성 AI의 지배적 패러다임이 되었지만, 물리적 기원에서 비롯된 근본적 한계가 있다.

- **느린 샘플링 속도**: 물리적 확산의 역방향을 시뮬레이션하므로 수십~수백 단계의 반복이 필요하다. GAN은 한 번의 전방 패스로 생성하지만, 확산 모델은 본질적으로 순차적이다. DDIM(Song et al. 2021), DPM-Solver(Lu et al. 2022), Consistency Models(Song et al. 2023) 등이 이를 완화하지만 완전히 해결하지는 못한다.
- **고노이즈 영역의 학습 불안정**: 거의 순수 노이즈에 가까운 높은 t 영역에서 디노이징은 본질적으로 어렵다. 전체 구조를 가장 먼저 결정하는 이 단계의 오류가 이후 모든 단계에 전파된다.
- **이론적 보장의 비현실성**: 역방향 SDE의 정확한 시뮬레이션은 무한히 작은 시간 단계와 완벽한 스코어 추정을 요구한다. 실제로는 이산화 오차와 스코어 근사 오차가 누적된다.
- **모드 커버리지 vs 모드 품질**: 확산 모델은 GAN에 비해 모드 붕괴(mode collapse)에 강하지만, 개별 샘플의 선명도에서는 여전히 트레이드오프가 있다.
- **물리학과의 괴리**: 실제 확산은 **열역학 제2법칙에 의해 비가역적**이다. 역방향 확산은 물리적으로 자연스러운 과정이 아니며, 이를 가능하게 하는 것은 물리 법칙이 아닌 신경망의 학습이다.

## 용어 정리

브라운 운동(Brownian motion) - 유체 속 미세 입자가 주변 분자의 충돌로 보이는 불규칙 운동. Einstein(1905)이 수학적으로 설명

확률적 미분방정식(stochastic differential equation, SDE) - 확정적 항(드리프트)과 확률적 항(확산)을 모두 포함하는 미분방정식

위너 과정(Wiener process) - 브라운 운동의 수학적 이상화. 독립적이고 정규분포를 따르는 무한소 증분을 갖는 연속 확률 과정

노이즈 스케줄(noise schedule) - 전방 확산 과정에서 각 시간 단계마다 추가되는 노이즈의 크기를 정하는 함수 beta_t

스코어 함수(score function) - 로그 확률 밀도의 그래디언트 grad_x log p(x). 데이터 분포에서 확률이 가장 빠르게 증가하는 방향

디노이징(denoising) - 노이즈가 추가된 데이터에서 원본 신호를 복원하는 과정. 확산 모델에서는 스코어 추정과 수학적으로 동등

잠재 공간 확산(latent diffusion) - 픽셀 공간 대신 압축된 잠재 공간에서 확산을 수행하여 계산 효율을 높인 방법

Classifier-free guidance - 조건부와 무조건부 스코어를 선형 결합하여 생성의 텍스트 정합성과 다양성을 조절하는 기법

Fokker-Planck 방정식 - 확률 밀도 함수의 시간 변화를 기술하는 편미분방정식. SDE의 거시적 대응물

재매개변수화(reparameterization) - DDPM에서 평균 대신 노이즈를 예측 대상으로 바꿔 학습을 안정화한 기법

---EN---
Diffusion Process and Stochastic Differential Equations - The physics of Brownian motion that became the mathematical core of modern image-generating AI

## Brownian Motion: The Physical Starting Point

In 1827, botanist Robert Brown observed pollen particles on water jittering and moving randomly. The physical explanation came 78 years later from Albert Einstein (1905). The pollen particles constantly collide with surrounding water molecules, and the accumulation of these microscopic collisions produces the macroscopically observable random motion.

Einstein described this process mathematically. The mean squared displacement of a particle after time t is proportional to time. This became the basis for the diffusion equation introducing the diffusion coefficient D. Three years later, Paul Langevin (1908) presented a more direct approach, describing individual particle motion through a stochastic differential equation.

## The Mathematics of Stochastic Differential Equations

Langevin's approach generalizes in modern notation to a Stochastic Differential Equation (SDE):

dx = f(x, t)dt + g(t)dW

Here f(x, t) is the drift term (deterministic force), g(t) is the diffusion coefficient (noise magnitude), and dW is the increment of a Wiener process. The Wiener process is the mathematical idealization of Brownian motion, possessing independent, normally distributed infinitesimal increments.

The physical meaning of this equation is as follows. Particle motion has two components: systematic movement due to external forces (**drift**) and random jittering from molecular collisions (**diffusion**). When diffusion dominates, the particle spreads out chaotically; when drift dominates, it moves in a specific direction.

Fokker and Planck derived a partial differential equation describing the time evolution of the probability density function p(x, t), rather than individual particle SDEs. This Fokker-Planck equation provides a macroscopic description of the diffusion process.

## From Diffusion to Generation: The Core Idea

Sohl-Dickstein et al. (2015), directly inspired by diffusion processes in physics, conceived a revolutionary idea. The process of **gradually adding noise to data until it becomes pure Gaussian noise** (the forward process) is mathematically identical to physical diffusion. If this process could be **learned in reverse**, could data be generated from pure noise?

The forward process is defined as:

q(x_t | x_{t-1}) = N(x_t; sqrt(1 - beta_t) * x_{t-1}, beta_t * I)

At each time step, a small amount of Gaussian noise (variance beta_t) is added to the data. The noise schedule beta_t typically increases over time. After sufficient steps, the original data structure is completely destroyed, leaving only isotropic Gaussian noise.

The reverse process is what the neural network learns:

p_theta(x_{t-1} | x_t) = N(x_{t-1}; mu_theta(x_t, t), sigma_t^2 * I)

The neural network mu_theta receives noisy x_t and predicts the mean of the one-step denoised x_{t-1}. Applying this reverse process iteratively from T down to 0 generates samples from the data distribution starting from pure noise.

## DDPM: The Practical Breakthrough

Ho, Jain, and Abbeel's (2020) DDPM (Denoising Diffusion Probabilistic Model) was the pivotal paper that made Sohl-Dickstein et al.'s idea practical. DDPM's key simplification was **redefining the neural network's learning objective**. Instead of directly predicting the mean, the network predicts the **noise itself** added at each time step:

epsilon_theta(x_t, t) ≈ epsilon (the originally added noise)

This reparameterization dramatically stabilized training. The loss function also simplified to the mean squared error between predicted and actual noise:

L = E[||epsilon - epsilon_theta(x_t, t)||^2]

It was shown mathematically that this loss function is equivalent to a weighted version of the variational lower bound.

## Score-Based SDE Framework

Song et al. (2021) unified the discrete-time diffusion process into a continuous SDE, showing that DDPM and score matching are two perspectives of the same framework.

The score function is the gradient of the log probability density:

s(x) = grad_x log p(x)

**If the score is known, Langevin dynamics can sample from the distribution**. The core insight is that **denoising is score estimation**. Predicting and removing noise is mathematically equivalent to estimating the steepest ascent direction (score) of the data distribution.

Anderson's (1982) reverse-time SDE is:

dx = [f(x, t) - g(t)^2 * grad_x log p_t(x)]dt + g(t)dW_bar

The **reverse drift** adds the score to the forward SDE's drift. When a neural network approximates the score, the reverse SDE is numerically solved to generate samples.

## The Physics Roots of DALL-E, Stable Diffusion, and Midjourney

This diffusion framework underpins modern image-generating AI. DALL-E 2 (Ramesh et al. 2022), Stable Diffusion (Rombach et al. 2022), and Midjourney all use diffusion processes as their core generation mechanism.

Stable Diffusion's key innovation is **latent diffusion**. Instead of performing diffusion directly in pixel space, diffusion operates in a compressed latent space from an autoencoder, dramatically reducing computational cost. The physics of diffusion is preserved; only the space changes.

Text-to-image conditional generation is implemented by conditioning the reverse process's drift on text embeddings. Classifier-free guidance (Ho & Salimans 2022) linearly combines conditional and unconditional scores to balance generation quality and text alignment.

## Limitations and Weaknesses

Diffusion models have become the dominant paradigm in generative AI, but they carry fundamental limitations rooted in their physical origins.

- **Slow sampling speed**: Simulating the reverse of physical diffusion requires tens to hundreds of iterative steps. GANs generate in a single forward pass, while diffusion models are inherently sequential. DDIM (Song et al. 2021), DPM-Solver (Lu et al. 2022), and Consistency Models (Song et al. 2023) mitigate but do not fully resolve this.
- **Training instability at high noise levels**: Denoising near-pure noise at high t is inherently difficult. Errors at this stage, which determine global structure first, propagate through all subsequent steps.
- **Unrealistic theoretical guarantees**: Exact simulation of the reverse SDE requires infinitesimally small time steps and perfect score estimation. In practice, discretization errors and score approximation errors accumulate.
- **Mode coverage vs. mode quality**: While diffusion models are more robust to mode collapse than GANs, there remains a trade-off in individual sample sharpness.
- **Divergence from physics**: Real diffusion is **irreversible under the second law of thermodynamics**. Reverse diffusion is not a physically natural process -- what makes it possible is not physical law but neural network learning.

## Glossary

Brownian motion - the irregular motion of microscopic particles in fluid due to collisions with surrounding molecules. Mathematically explained by Einstein (1905)

Stochastic differential equation (SDE) - a differential equation containing both deterministic (drift) and stochastic (diffusion) terms

Wiener process - the mathematical idealization of Brownian motion. A continuous stochastic process with independent, normally distributed infinitesimal increments

Noise schedule - a function beta_t determining the magnitude of noise added at each time step of the forward diffusion process

Score function - the gradient of the log probability density, grad_x log p(x). The direction of steepest probability increase in the data distribution

Denoising - the process of recovering original signal from noisy data. Mathematically equivalent to score estimation in diffusion models

Latent diffusion - a method that performs diffusion in a compressed latent space instead of pixel space for computational efficiency

Classifier-free guidance - a technique that linearly combines conditional and unconditional scores to balance text alignment and diversity in generation

Fokker-Planck equation - a partial differential equation describing the time evolution of probability density functions. The macroscopic counterpart of SDEs

Reparameterization - a technique in DDPM that stabilized training by changing the prediction target from mean to noise
