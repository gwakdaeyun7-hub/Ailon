---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 확산 과정, 브라운 운동, 랑주뱅 방정식, 확률적 미분방정식, 디노이징 확산 모델, 스코어 매칭, 노이즈 스케줄, 역방향 SDE
keywords_en: diffusion process, Brownian motion, Langevin equation, stochastic differential equation, denoising diffusion model, score matching, noise schedule, reverse-time SDE
---
Diffusion Process - 브라운 운동의 물리학이 현대 이미지 생성 AI의 수학적 뼈대가 된 과정

## 확산의 물리적 원리

1827년 식물학자 Robert Brown은 물 위에 떠 있는 꽃가루 입자가 아무런 외력 없이 불규칙하게 떨리는 것을 관찰했다. 원인은 78년 뒤 Albert Einstein(1905)이 밝혔다. 꽃가루 입자 주위의 물 분자 수십억 개가 매초 충돌하며, 한쪽에서 더 세게 치는 순간마다 입자가 밀린다. 한 번의 충돌은 무시할 만큼 작지만, 그 충돌의 누적이 현미경으로 볼 수 있는 수준의 무작위 운동을 만든다.

핵심 정량적 결과는 이것이다. 시간 t가 지난 후 입자의 평균 제곱 변위(mean squared displacement)는 시간에 비례한다. 2배 오래 기다리면 2배 멀리 퍼진다. 이 비례 상수가 확산 계수 D이며, 온도가 높을수록, 유체의 점성이 낮을수록 D가 커진다. 공간적으로 상상하면, 잉크 한 방울을 물에 떨어뜨렸을 때 잉크가 서서히 퍼져나가는 과정이 바로 확산이다. 처음에는 한 점에 몰려 있던 잉크 분자들이 시간이 지나면서 물 전체에 균일하게 퍼진다. 이 퍼짐의 끝은 완전한 균일 상태, 즉 어디서 떠도 잉크 농도가 같아지는 상태다.

## 개별 입자에서 확률 분포로

Einstein의 확산 방정식은 입자 **집단**의 농도 변화를 기술한다. 3년 후 Paul Langevin(1908)은 **개별 입자** 하나의 궤적을 기술하는 다른 접근법을 제시했다. 현대적 표기로 일반화하면 확률적 미분방정식(Stochastic Differential Equation, SDE)이 된다.

dx = f(x, t)dt + g(t)dW

1. f(x, t)dt는 **드리프트**(drift) 항이다. 외부 힘이 입자를 특정 방향으로 밀어내는 결정론적 성분이다. 중력이 공을 아래로 끌어당기는 것처럼, 예측 가능한 이동을 담당한다.
2. g(t)dW는 **확산**(diffusion) 항이다. 분자 충돌로 인한 무작위 떨림이며, dW는 위너 과정(Wiener process)의 증분으로 독립적이고 정규분포를 따르는 무한소 랜덤 충격이다.
3. g(t)는 확산 계수로, 이 값이 클수록 노이즈의 진폭이 커진다. g(t)가 0이면 결정론적 상미분방정식, f가 0이면 순수 랜덤 워크가 된다.

이 SDE가 기술하는 것은 하나의 입자지만, 같은 조건에서 많은 입자를 동시에 놓으면 그 위치의 확률 분포가 시간에 따라 변한다. Fokker와 Planck은 이 확률 밀도 p(x, t)의 시간 변화를 편미분방정식으로 유도했다. 이것이 Fokker-Planck 방정식이며, 개별 궤적의 SDE와 집단 분포의 편미분방정식이 동전의 양면임을 보여준다.

## 물리학에서 생성 모델로

이 물리학을 AI로 가져온 핵심 발상은 Sohl-Dickstein et al.(2015)에서 나왔다. 그들의 착안은 다음과 같다. 깨끗한 이미지에 아주 작은 가우시안 노이즈를 반복적으로 더하면, 충분한 단계 후에 원래 이미지의 구조가 완전히 사라지고 순수한 가우시안 노이즈만 남는다. 이 과정은 잉크가 물에 퍼져 균일해지는 확산과 수학적으로 동일하다. 그렇다면 이 확산을 **거꾸로 되돌리는** 방법을 학습할 수 있다면, 순수 노이즈에서 이미지를 만들어낼 수 있다.

이 아이디어가 현실이 될 수 있었던 수학적 근거는 Anderson(1982)이 이미 증명해 두었다. 전방 SDE가 있으면 대응하는 역방향 SDE가 존재하며, 그 역방향 SDE는 데이터의 스코어 함수(score function), 즉 로그 확률 밀도의 그래디언트 grad_x log p_t(x)만 알면 풀 수 있다. 핵심 대응 관계는 다음과 같다.

- 잉크 퍼짐(물리적 확산) --> **이미지에 노이즈 추가** (전방 과정)
- 확산 계수 D --> **노이즈 스케줄 beta_t** (각 단계에서 얼마나 노이즈를 넣는가)
- 열역학적 평형(균일 분포) --> **순수 가우시안 노이즈** (전방 과정의 종착점)
- 개별 분자의 무작위 충돌 --> **각 단계의 가우시안 노이즈 샘플링**
- Langevin 방정식의 드리프트 항 --> **신경망이 학습하는 디노이징 방향**

## 전방 과정과 역방향 과정: 핵심 메커니즘

**전방 과정**(forward process)은 설계자가 정의한다. 학습이 필요 없다.

q(x_t | x_{t-1}) = N(x_t; sqrt(1 - beta_t) * x_{t-1}, beta_t * I)

1. 시간 단계 t에서 이전 데이터 x_{t-1}에 가우시안 노이즈를 더한다. beta_t는 노이즈의 크기를 결정하는 **노이즈 스케줄**이다.
2. sqrt(1 - beta_t)를 곱하는 이유는 분산이 누적되어 폭발하는 것을 막기 위해서다. 이 계수가 원래 신호를 조금씩 줄이면서 노이즈를 더하므로, 전체 분산이 1 근처에 유지된다.
3. beta_t가 0에 가까우면 거의 노이즈를 넣지 않으므로 원본이 보존되고, beta_t가 1에 가까우면 이전 정보를 거의 지운다. 실제로는 beta_1 = 0.0001에서 beta_T = 0.02 정도로 서서히 증가시킨다.
4. T = 1000 단계를 거치면 어떤 이미지로 시작하든 결과는 거의 동일한 등방적(isotropic) 가우시안 노이즈가 된다. 출발점의 정보가 완전히 소실된 상태다.

**역방향 과정**(reverse process)은 신경망이 학습하는 부분이다.

p_theta(x_{t-1} | x_t) = N(x_{t-1}; mu_theta(x_t, t), sigma_t^2 * I)

1. 노이즈가 섞인 x_t와 시간 단계 t를 받아, 한 단계 깨끗한 x_{t-1}의 평균을 예측한다.
2. 이것을 T = 1000에서 t = 0까지 반복 적용하면, 순수 노이즈에서 출발하여 데이터 분포에 속하는 깨끗한 이미지에 도착한다.
3. 물리적 확산에서 잉크가 퍼지는 건 자연스럽지만, 퍼진 잉크가 다시 한 점으로 모이는 건 열역학 제2법칙에 의해 자연적으로는 불가능하다. 이 "불가능한 역방향"을 가능하게 만드는 것이 신경망의 학습이다.

## 무엇을 예측할 것인가: DDPM의 재매개변수화

Sohl-Dickstein et al.(2015)의 원래 프레임워크는 개념적으로 올바르지만 실용적 성능이 부족했다. Ho, Jain, Abbeel(2020)의 DDPM(Denoising Diffusion Probabilistic Model)이 결정적 돌파구를 만들었다. 핵심 아이디어는 **예측 대상을 바꾼 것**이다.

원래 접근: 신경망이 디노이징된 평균 mu를 직접 예측한다. 문제는 각 시간 단계마다 mu의 스케일이 달라 학습이 불안정하다는 것이다.

DDPM의 접근: 신경망 epsilon_theta가 각 단계에서 **추가된 노이즈 자체**를 예측한다.

epsilon_theta(x_t, t) ≈ epsilon

이 재매개변수화(reparameterization)가 작동하는 이유는, x_t = sqrt(alpha_bar_t) * x_0 + sqrt(1 - alpha_bar_t) * epsilon이라는 관계 덕분에 노이즈를 알면 평균을 복원할 수 있기 때문이다. alpha_bar_t는 (1 - beta_1)(1 - beta_2)...(1 - beta_t)의 누적곱이다. t가 작으면 alpha_bar_t가 1에 가까워 원본 x_0이 잘 보존되고, t가 크면 alpha_bar_t가 0에 가까워 거의 순수 노이즈만 남는다.

손실 함수도 극적으로 단순해진다.

L = E[||epsilon - epsilon_theta(x_t, t)||^2]

실제 추가된 노이즈 epsilon과 신경망이 예측한 노이즈 epsilon_theta의 평균 제곱 오차다. 이 손실이 변분 하한(variational lower bound)의 가중 버전과 수학적으로 동등하다는 것이 증명되었다.

## 디노이징과 스코어: 동전의 양면

Song et al.(2021, "Score-Based Generative Modeling through Stochastic Differential Equations")은 이산적 시간 단계의 확산을 연속적 SDE로 통합하여, DDPM과 스코어 매칭(score matching)이 같은 프레임워크의 두 관점임을 보였다.

스코어 함수는 로그 확률 밀도의 그래디언트다.

s(x) = grad_x log p(x)

이것이 의미하는 바를 공간적으로 상상하면 이렇다. 데이터 분포를 언덕의 높이로 표현한 지형도라 하자. 높은 곳이 데이터가 많이 모여 있는 영역이다. 스코어는 이 지형의 가장 가파른 오르막 방향을 가리키는 화살표다. 어떤 점에 서 있더라도 스코어가 가리키는 방향을 따라 걸어가면 "데이터가 밀집한 봉우리"에 도달한다.

핵심 통찰은 **노이즈를 예측하여 제거하는 것이 스코어를 추정하는 것과 수학적으로 동등**하다는 것이다. DDPM이 "여기에 어떤 노이즈가 끼었는가"를 맞추는 것과, 스코어 모델이 "여기서 데이터가 가장 많은 방향은 어디인가"를 맞추는 것은 부호와 스케일링 차이만 있을 뿐 같은 문제다.

Anderson(1982)이 증명한 역방향 SDE는 다음과 같다.

dx = [f(x, t) - g(t)^2 * grad_x log p_t(x)]dt + g(t)dW_bar

전방 SDE의 드리프트 f(x, t)에 스코어에 비례하는 항을 빼면 역방향 드리프트가 된다. 신경망이 스코어를 근사하면 이 역방향 SDE를 수치적으로 풀어 샘플을 생성한다. g(t)^2이 곱해져 있으므로, 확산 계수가 큰 시간 단계(노이즈가 많은 단계)에서 스코어의 영향이 더 크다.

## 현대 AI 기법과의 연결

확산 과정의 물리학은 현대 생성 AI의 지배적 패러다임이 되었다. 각 연결의 성격은 다르다.

**같은 물리적 원리의 직접 적용:**

- **DALL-E 2, Stable Diffusion, Midjourney**: 모두 확산 과정을 핵심 생성 메커니즘으로 사용한다. Stable Diffusion(Rombach et al. 2022)의 핵심 혁신은 **잠재 공간 확산**(latent diffusion)이다. 512x512 이미지의 픽셀 공간(786,432차원)에서 직접 확산을 하면 계산이 막대하다. 대신 오토인코더로 64x64 잠재 공간(4,096차원)까지 압축한 뒤 그 공간에서 확산을 수행한다. 물리학의 확산 원리는 보존하되, 작동하는 공간만 바꾼 것이다.
- **텍스트-이미지 조건부 생성**: 역방향 과정의 드리프트를 텍스트 임베딩으로 조건화하여 구현한다. Classifier-free guidance(Ho & Salimans 2022)는 조건부 스코어와 무조건부 스코어를 선형 결합하여 생성 품질과 텍스트 정합성을 조절한다. 가이던스 스케일 w가 클수록 텍스트에 충실하지만 다양성이 줄고, w = 1이면 조건부 생성만, w = 0이면 무조건부 생성이 된다.
- **비디오, 오디오, 3D 생성**: 동일한 확산 프레임워크가 이미지를 넘어 비디오(Sora), 오디오(AudioLDM), 3D(DreamFusion) 생성에도 확장되었다. 데이터의 종류가 바뀌어도 "노이즈 추가 후 역방향 복원"이라는 핵심 구조는 동일하다.

**동일한 직관을 독립적으로 공유하는 구조적 유사성:**

- **VAE의 잠재 공간 샘플링**: VAE(Variational Autoencoder)도 노이즈에서 데이터를 생성하지만, 단일 잠재 변수에서 한 번에 디코딩한다. 확산 모델은 수백 단계에 걸쳐 점진적으로 노이즈를 제거한다. "노이즈에서 출발"이라는 직관은 공유하지만 생성 메커니즘은 근본적으로 다르다.
- **GAN의 노이즈-to-이미지**: GAN도 랜덤 노이즈에서 이미지를 생성하지만, 물리적 확산과 무관하게 게임 이론의 적대적 학습(Goodfellow 2014)에서 유래했다. 확산 모델과의 유사성은 입출력 구조의 우연한 일치다.

## 한계와 약점

- **느린 샘플링 속도**: 물리적 확산의 역방향을 시뮬레이션하므로 수십~수백 단계의 순차적 반복이 필요하다. GAN은 한 번의 전방 패스로 이미지를 생성하지만, 확산 모델은 T = 1000 단계를 밟는 것이 원래 설계다. DDIM(Song et al. 2021)이 50단계로, Consistency Models(Song et al. 2023)가 1~2단계로 줄이는 시도를 하지만 품질 손실이 수반된다.
- **고노이즈 단계의 학습 불안정**: t가 T에 가까운 거의 순수 노이즈 영역에서 디노이징은 본질적으로 어렵다. 이 단계가 이미지의 전체 구조(물체 배치, 구도)를 결정하기 때문에, 여기서의 오류가 이후 모든 단계에 전파된다.
- **이론과 실제의 괴리**: 역방향 SDE의 정확한 시뮬레이션은 무한히 작은 시간 단계와 완벽한 스코어 추정을 전제한다. 실제로는 이산화 오차와 스코어 근사 오차가 누적되며, 이론적 보장은 실용적 조건에서 성립하지 않는다.
- **열역학과의 근본적 괴리**: 실제 확산은 열역학 제2법칙에 의해 비가역적이다. 퍼진 잉크가 저절로 다시 모이지 않는 것처럼, 역방향 확산은 물리적으로 자연스러운 과정이 아니다. 이를 가능하게 하는 것은 물리 법칙이 아닌 신경망의 학습이며, 이 점에서 물리학적 비유의 한계가 명확하다.

## 용어 정리

브라운 운동(Brownian motion) - 유체 속 미세 입자가 주변 분자의 충돌로 보이는 불규칙 운동. Einstein(1905)이 분자 운동론으로 설명하여 원자의 실재를 간접 입증했다

확률적 미분방정식(stochastic differential equation, SDE) - 결정론적 드리프트 항과 확률적 확산 항을 동시에 포함하는 미분방정식. 개별 입자의 궤적을 기술한다

위너 과정(Wiener process) - 브라운 운동의 수학적 이상화. 0에서 시작하고, 독립적이며 정규분포를 따르는 증분을 가지고, 경로가 연속이지만 어디서도 미분 불가능한 확률 과정

드리프트(drift) - SDE에서 외부 힘에 의한 결정론적 이동 성분. 중력이 물체를 끌어당기듯 예측 가능한 방향으로의 이동

노이즈 스케줄(noise schedule) - 전방 확산 과정에서 각 시간 단계 t마다 추가되는 노이즈의 크기 beta_t를 정하는 함수. 보통 시간이 진행될수록 증가한다

스코어 함수(score function) - 로그 확률 밀도의 그래디언트 grad_x log p(x). 데이터 분포에서 확률이 가장 빠르게 증가하는 방향을 가리킨다

재매개변수화(reparameterization) - DDPM에서 신경망의 예측 대상을 평균에서 노이즈로 바꿔 학습을 안정화한 기법

잠재 공간 확산(latent diffusion) - 고차원 픽셀 공간 대신 오토인코더로 압축한 저차원 잠재 공간에서 확산을 수행하는 방법. Stable Diffusion의 핵심 설계

Fokker-Planck 방정식 - 확률 밀도 함수 p(x, t)의 시간 변화를 기술하는 편미분방정식. 개별 궤적의 SDE에 대응하는 집단적 관점

Classifier-free guidance - 조건부 스코어와 무조건부 스코어를 선형 결합하여 생성의 텍스트 정합성과 다양성을 조절하는 기법. 가이던스 스케일 w로 강도를 조절한다

---EN---
Diffusion Process - How the physics of Brownian motion became the mathematical backbone of modern image-generating AI

## The Physics of Diffusion

In 1827, botanist Robert Brown observed pollen particles floating on water jittering erratically with no external force. The cause was revealed 78 years later by Albert Einstein (1905). Billions of water molecules surrounding each pollen particle collide with it every second, and whenever one side strikes harder in a given instant, the particle gets pushed. A single collision is negligibly small, but the accumulation of these collisions produces random motion visible under a microscope.

The key quantitative result is this: the mean squared displacement of a particle after time t is proportional to t. Wait twice as long and the particle drifts twice as far on average. The proportionality constant is the diffusion coefficient D, which increases with temperature and decreases with fluid viscosity. Spatially, imagine dropping a single drop of ink into water. The ink gradually spreads outward. Molecules initially concentrated at a single point disperse until the ink is uniformly distributed throughout. The end state of this spreading is complete uniformity -- the same ink concentration everywhere.

## From Individual Particles to Probability Distributions

Einstein's diffusion equation describes how the concentration of a **population** of particles changes. Three years later, Paul Langevin (1908) took a different approach: describing the trajectory of a **single** particle. In modern notation, this generalizes to a Stochastic Differential Equation (SDE):

dx = f(x, t)dt + g(t)dW

1. f(x, t)dt is the **drift** term -- the deterministic component where external forces push the particle in a predictable direction, like gravity pulling a ball downward.
2. g(t)dW is the **diffusion** term -- random jittering from molecular collisions, where dW is the increment of a Wiener process: independent, normally distributed infinitesimal random shocks.
3. g(t) is the diffusion coefficient controlling noise amplitude. When g(t) = 0, the equation reduces to a deterministic ODE; when f = 0, it becomes a pure random walk.

This SDE describes one particle, but if many particles start under identical conditions, the probability distribution of their positions evolves over time. Fokker and Planck derived a partial differential equation governing the time evolution of this probability density p(x, t). The Fokker-Planck equation shows that the individual-trajectory SDE and the collective-distribution PDE are two sides of the same coin.

## From Physics to Generative Model

The key idea that brought this physics into AI came from Sohl-Dickstein et al. (2015). Their insight was as follows: if you repeatedly add tiny amounts of Gaussian noise to a clean image, after enough steps the original structure vanishes entirely, leaving only pure Gaussian noise. This process is mathematically identical to ink diffusing in water until uniform. If this diffusion could be **learned in reverse**, images could be created from pure noise.

The mathematical foundation for this already existed. Anderson (1982) had proven that for any forward SDE, there exists a corresponding reverse-time SDE, solvable if one knows the score function of the data -- the gradient of the log probability density, grad_x log p_t(x). The key correspondences are:

- Ink spreading (physical diffusion) --> **adding noise to an image** (forward process)
- Diffusion coefficient D --> **noise schedule beta_t** (how much noise per step)
- Thermodynamic equilibrium (uniform distribution) --> **pure Gaussian noise** (forward process endpoint)
- Individual molecular collisions --> **Gaussian noise sampling at each step**
- Drift term in the Langevin equation --> **denoising direction learned by the neural network**

## Forward and Reverse Process: Core Mechanism

The **forward process** is defined by the designer. No learning is required.

q(x_t | x_{t-1}) = N(x_t; sqrt(1 - beta_t) * x_{t-1}, beta_t * I)

1. At time step t, Gaussian noise is added to the previous data x_{t-1}. beta_t is the **noise schedule** determining the noise magnitude.
2. The multiplication by sqrt(1 - beta_t) prevents variance from exploding as noise accumulates. This factor gradually shrinks the original signal while adding noise, keeping total variance near 1.
3. When beta_t is close to 0, almost no noise is added and the original is preserved; when beta_t approaches 1, previous information is nearly erased. In practice, beta_1 starts around 0.0001 and increases to about beta_T = 0.02.
4. After T = 1000 steps, regardless of the starting image, the result is nearly identical isotropic Gaussian noise. All information about the starting point has been destroyed.

The **reverse process** is what the neural network learns:

p_theta(x_{t-1} | x_t) = N(x_{t-1}; mu_theta(x_t, t), sigma_t^2 * I)

1. Given noisy x_t and time step t, the network predicts the mean of the one-step-cleaner x_{t-1}.
2. Applying this iteratively from T = 1000 down to t = 0 produces a clean image from pure noise.
3. In physical diffusion, ink spreading is natural, but ink spontaneously gathering back into a single drop violates the second law of thermodynamics. What makes this "impossible reverse" possible is not physical law but neural network learning.

## What to Predict: DDPM's Reparameterization

Sohl-Dickstein et al.'s (2015) original framework was conceptually sound but lacked practical performance. Ho, Jain, and Abbeel's (2020) DDPM (Denoising Diffusion Probabilistic Model) achieved the decisive breakthrough. The key idea was **changing the prediction target**.

Original approach: the neural network directly predicts the denoised mean mu. The problem is that mu's scale varies across time steps, making training unstable.

DDPM's approach: the neural network epsilon_theta predicts the **noise itself** added at each step:

epsilon_theta(x_t, t) ≈ epsilon

This reparameterization works because of the relationship x_t = sqrt(alpha_bar_t) * x_0 + sqrt(1 - alpha_bar_t) * epsilon -- knowing the noise lets you recover the mean. Here alpha_bar_t is the cumulative product (1 - beta_1)(1 - beta_2)...(1 - beta_t). When t is small, alpha_bar_t is near 1 and the original x_0 is well preserved; when t is large, alpha_bar_t approaches 0 and almost only pure noise remains.

The loss function also simplifies dramatically:

L = E[||epsilon - epsilon_theta(x_t, t)||^2]

This is the mean squared error between the actual added noise epsilon and the network's prediction epsilon_theta. It was proven mathematically equivalent to a weighted version of the variational lower bound.

## Denoising and Score: Two Sides of One Coin

Song et al. (2021, "Score-Based Generative Modeling through Stochastic Differential Equations") unified discrete-time diffusion into a continuous SDE framework, showing that DDPM and score matching are two perspectives of the same thing.

The score function is the gradient of the log probability density:

s(x) = grad_x log p(x)

To visualize this spatially: represent the data distribution as a terrain map where height indicates probability. High points are regions where data is dense. The score is an arrow at every point indicating the steepest uphill direction. Standing anywhere and following the arrows leads toward a "data-dense peak."

The core insight is that **predicting and removing noise is mathematically equivalent to estimating the score**. DDPM asking "what noise was added here?" and a score model asking "which direction has the most data?" differ only by sign and scaling.

Anderson's (1982) reverse-time SDE is:

dx = [f(x, t) - g(t)^2 * grad_x log p_t(x)]dt + g(t)dW_bar

Subtracting the score-proportional term from the forward SDE's drift yields the reverse drift. When a neural network approximates the score, the reverse SDE is solved numerically to generate samples. The g(t)^2 factor means the score's influence is greater at time steps with large diffusion coefficients -- precisely the high-noise steps where global structure is determined.

## Connections to Modern AI

The physics of diffusion has become the dominant paradigm in modern generative AI. The nature of each connection differs.

**Direct application of the same physical principle:**

- **DALL-E 2, Stable Diffusion, Midjourney**: All use diffusion as their core generation mechanism. Stable Diffusion's (Rombach et al. 2022) key innovation is **latent diffusion**. Running diffusion directly in the pixel space of a 512x512 image (786,432 dimensions) is computationally enormous. Instead, an autoencoder compresses to a 64x64 latent space (4,096 dimensions) where diffusion operates. The physics of diffusion is preserved; only the working space changes.
- **Text-to-image conditional generation**: Implemented by conditioning the reverse process's drift on text embeddings. Classifier-free guidance (Ho & Salimans 2022) linearly combines conditional and unconditional scores to balance generation quality and text alignment. Higher guidance scale w increases text fidelity but reduces diversity; w = 1 gives purely conditional generation, w = 0 gives unconditional.
- **Video, audio, and 3D generation**: The same diffusion framework extends beyond images to video (Sora), audio (AudioLDM), and 3D (DreamFusion). Though the data type changes, the core structure of "add noise then reverse" remains identical.

**Structural similarities sharing the same intuition independently:**

- **VAE latent space sampling**: VAEs also generate data from noise, but decode from a single latent variable in one pass. Diffusion models remove noise gradually over hundreds of steps. They share the "start from noise" intuition but their generation mechanisms are fundamentally different.
- **GAN noise-to-image**: GANs also generate images from random noise, but originate from game theory's adversarial training (Goodfellow 2014), unrelated to physical diffusion. The similarity to diffusion models is a coincidence of input-output structure.

## Limitations and Weaknesses

- **Slow sampling speed**: Simulating the reverse of physical diffusion requires tens to hundreds of sequential steps. GANs generate in a single forward pass, while diffusion models originally require T = 1000 steps. DDIM (Song et al. 2021) reduces this to 50 steps and Consistency Models (Song et al. 2023) to 1-2 steps, but with accompanying quality loss.
- **Training instability at high noise levels**: Denoising near-pure noise at t close to T is inherently difficult. Since this stage determines the image's global structure (object placement, composition), errors here propagate through all subsequent steps.
- **Gap between theory and practice**: Exact simulation of the reverse SDE assumes infinitesimally small time steps and perfect score estimation. In reality, discretization errors and score approximation errors accumulate, and theoretical guarantees do not hold under practical conditions.
- **Fundamental divergence from thermodynamics**: Real diffusion is irreversible under the second law of thermodynamics. Just as dispersed ink does not spontaneously reconcentrate, reverse diffusion is not a physically natural process. What makes it possible is neural network learning, not physical law -- a point where the physics analogy clearly breaks down.

## Glossary

Brownian motion - the irregular motion of microscopic particles in fluid caused by collisions with surrounding molecules. Einstein (1905) explained it through kinetic theory, indirectly proving the existence of atoms

Stochastic differential equation (SDE) - a differential equation containing both a deterministic drift term and a stochastic diffusion term. Describes the trajectory of an individual particle

Wiener process - the mathematical idealization of Brownian motion. Starts at 0, has independent normally distributed increments, and has continuous but nowhere differentiable paths

Drift - the deterministic component in an SDE representing systematic movement from external forces, like gravity pulling an object in a predictable direction

Noise schedule - a function beta_t determining the magnitude of noise added at each time step t of the forward diffusion process. Typically increases over time

Score function - the gradient of the log probability density, grad_x log p(x). Points in the direction of steepest probability increase in the data distribution

Reparameterization - a technique in DDPM that stabilized training by changing the neural network's prediction target from mean to noise

Latent diffusion - performing diffusion in a low-dimensional latent space compressed by an autoencoder instead of high-dimensional pixel space. The core design of Stable Diffusion

Fokker-Planck equation - a partial differential equation describing the time evolution of the probability density function p(x, t). The collective-distribution counterpart of the individual-trajectory SDE

Classifier-free guidance - a technique that linearly combines conditional and unconditional scores to balance text alignment and diversity in generation. Strength is controlled by the guidance scale w
